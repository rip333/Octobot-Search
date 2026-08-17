/**
 * Shared layout engine for the 3x6 Marvel Champions print sheets.
 *
 * The fronts and backs scripts differ only in grid column order and canvas
 * rotation, so both traversal and sorting live here and stay identical.
 *
 * Include from a sheet script and call `runChampionsGrid(config)`:
 *
 *   #include "./champions-grid-common.jsx"
 *   runChampionsGrid({ sheetName: "fronts", columnOrderMM: [...], rotation: 90 });
 */

var CHAMPIONS_GRID = (function () {
    var DPI = 300;
    var CARDS_PER_SHEET = 18;
    var IMAGE_WIDTH_MM = 93.9;
    var IMAGE_HEIGHT_MM = 67.31;
    var ROW_ORDER_MM = [28.7, 95.25, 161.62, 228.17, 294.72, 361.1];
    var OUTPUT_FOLDER_NAME = "print-files";
    var CONFIG_FILE_NAME = "champions-grid-config.json";

    function mmToPx(mm) {
        return (mm / 25.4) * DPI;
    }

    function buildPositions(columnOrderMM) {
        var positions = [];
        for (var row = 0; row < ROW_ORDER_MM.length; row++) {
            for (var column = 0; column < columnOrderMM.length; column++) {
                positions.push({
                    x: mmToPx(columnOrderMM[column]),
                    y: mmToPx(ROW_ORDER_MM[row]),
                    width: mmToPx(IMAGE_WIDTH_MM),
                    height: mmToPx(IMAGE_HEIGHT_MM)
                });
            }
        }
        return positions;
    }

    /** Natural compare so 1, 2, 10 order correctly instead of 1, 10, 2. */
    function compareAlphaNumeric(aName, bName) {
        var pattern = /(\d+)|(\D+)/g;
        var aParts = aName.toLowerCase().match(pattern) || [];
        var bParts = bName.toLowerCase().match(pattern) || [];
        var length = Math.min(aParts.length, bParts.length);

        for (var i = 0; i < length; i++) {
            var a = aParts[i];
            var b = bParts[i];

            if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
                var na = parseInt(a, 10);
                var nb = parseInt(b, 10);
                if (na !== nb) return na < nb ? -1 : 1;
            } else if (a !== b) {
                return a < b ? -1 : 1;
            }
        }

        if (aParts.length !== bParts.length) return aParts.length < bParts.length ? -1 : 1;
        return 0;
    }

    /**
     * Collects PNGs recursively, skipping generated output. Without this a
     * second run would lay out the sheets produced by the first one.
     */
    function collectPngs(folder, collected) {
        var items = folder.getFiles();

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (item instanceof Folder) {
                if (item.name.toLowerCase() === OUTPUT_FOLDER_NAME) continue;
                collectPngs(item, collected);
            } else if (item instanceof File && /\.png$/i.test(item.name)) {
                collected.push(item);
            }
        }

        return collected;
    }

    /** Groups by folder, then natural-sorts within it, for both sheet kinds. */
    function sortFiles(files) {
        files.sort(function (a, b) {
            var dirA = a.parent.fsName.toLowerCase();
            var dirB = b.parent.fsName.toLowerCase();
            if (dirA !== dirB) return dirA < dirB ? -1 : 1;
            return compareAlphaNumeric(a.name, b.name);
        });
        return files;
    }

    function readJsonFile(file) {
        if (!file.exists) return null;
        try {
            file.open("r");
            var text = file.read();
            file.close();
            // ExtendScript has no JSON parser; the config is small and trusted.
            return eval("(" + text + ")");
        } catch (error) {
            try { file.close(); } catch (ignored) { /* already closed */ }
            return null;
        }
    }

    /**
     * Resolves the base PSD from `champions-grid-config.json` beside this
     * script, falling back to a file picker. No path is hardcoded.
     */
    function resolveBasePsd(scriptFolder) {
        var config = readJsonFile(new File(scriptFolder.fsName + "/" + CONFIG_FILE_NAME));

        if (config && config.basePsd) {
            var configured = new File(config.basePsd);
            if (configured.exists) return configured;
            alert("Configured basePsd does not exist:\n" + config.basePsd + "\n\nPick one instead.");
        }

        var picked = File.openDialog("Select the base PSD template for the print sheet", "*.psd");
        if (!picked) return null;

        alert(
            "Tip: create " + CONFIG_FILE_NAME + " next to these scripts with\n\n" +
            '{ "basePsd": "' + picked.fsName.replace(/\\/g, "/") + '" }\n\n' +
            "to skip this prompt next time."
        );

        return picked;
    }

    /** Places one image; always closes the temporary document, even on failure. */
    function placeImage(baseDoc, importGroup, sourceFile, position, rotation) {
        var tempDoc = app.open(sourceFile);

        try {
            tempDoc.rotateCanvas(rotation);
            tempDoc.resizeImage(
                UnitValue(position.width, "px"),
                UnitValue(position.height, "px"),
                null,
                ResampleMethod.BICUBIC
            );

            tempDoc.selection.selectAll();
            tempDoc.selection.copy();
        } finally {
            tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        }

        app.activeDocument = baseDoc;
        baseDoc.paste();

        var layer = baseDoc.activeLayer;
        layer.move(importGroup, ElementPlacement.INSIDE);

        baseDoc.selection.deselect();
        app.tool = "moveTool";

        var bounds = layer.bounds;
        layer.translate(
            new UnitValue(position.x - bounds[0].as("px"), "px"),
            new UnitValue(position.y - bounds[1].as("px"), "px")
        );
    }

    function exportSheet(baseDoc, outputFolder, sheetNumber) {
        var options = new ExportOptionsSaveForWeb();
        options.format = SaveDocumentType.PNG;
        options.PNG8 = false;
        options.transparency = false;
        options.quality = 100;

        baseDoc.exportDocument(
            new File(outputFolder.fsName + "/layout_" + sheetNumber + ".png"),
            ExportType.SAVEFORWEB,
            options
        );
    }

    function buildBatch(files, batchIndex, fillerFile) {
        var batch = [];

        for (var i = 0; i < CARDS_PER_SHEET; i++) {
            var index = batchIndex * CARDS_PER_SHEET + i;
            if (index >= files.length) break;
            batch.push(files[index]);
        }

        while (batch.length < CARDS_PER_SHEET) {
            batch.push(fillerFile && fillerFile.exists
                ? fillerFile
                : files[batch.length % files.length]);
        }

        return batch;
    }

    /**
     * @param {{ sheetName: string, columnOrderMM: number[], rotation: number,
     *           offerFiller?: boolean, scriptFile?: File }} config
     */
    function run(config) {
        var scriptFile = config.scriptFile || new File($.fileName);
        var scriptFolder = scriptFile.parent;

        var sourceFolder = Folder.selectDialog("Select the folder containing PNG images to lay out");
        if (!sourceFolder) {
            alert("No folder selected.");
            return;
        }

        var files = sortFiles(collectPngs(sourceFolder, []));
        if (files.length === 0) {
            alert("No PNG files found in the selected folder (generated '" + OUTPUT_FOLDER_NAME + "' folders are skipped).");
            return;
        }

        var baseFile = resolveBasePsd(scriptFolder);
        if (!baseFile) {
            alert("No base PSD selected.");
            return;
        }

        var fillerFile = null;
        if (config.offerFiller) {
            fillerFile = File.openDialog("Select a backup PNG to fill short sheets (Cancel to repeat cards instead)", "*.png");
        }

        var outputFolder = new Folder(sourceFolder.fsName + "/" + OUTPUT_FOLDER_NAME);
        if (!outputFolder.exists) outputFolder.create();

        var positions = buildPositions(config.columnOrderMM);
        var sheetCount = Math.ceil(files.length / CARDS_PER_SHEET);
        var completed = 0;

        for (var batchIndex = 0; batchIndex < sheetCount; batchIndex++) {
            var baseDoc = app.open(baseFile);

            try {
                app.activeDocument = baseDoc;
                var importGroup = baseDoc.layerSets.add();
                importGroup.name = "Imported Images";

                var batch = buildBatch(files, batchIndex, fillerFile);
                for (var i = 0; i < CARDS_PER_SHEET; i++) {
                    placeImage(baseDoc, importGroup, batch[i], positions[i], config.rotation);
                }

                exportSheet(baseDoc, outputFolder, batchIndex + 1);
                completed++;
            } catch (error) {
                alert("Sheet " + (batchIndex + 1) + " failed:\n" + error);
                break;
            } finally {
                // Always leave Photoshop clean, even after a mid-sheet failure.
                baseDoc.close(SaveOptions.DONOTSAVECHANGES);
            }
        }

        alert(
            "Exported " + completed + " of " + sheetCount + " " + config.sheetName +
            " sheet(s) to '" + OUTPUT_FOLDER_NAME + "'."
        );
    }

    return { run: run, CARDS_PER_SHEET: CARDS_PER_SHEET };
})();

function runChampionsGrid(config) {
    CHAMPIONS_GRID.run(config);
}
