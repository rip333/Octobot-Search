// === SETTINGS ===
var DPI = 300;
function mmToPx(mm) {
    return (mm / 25.4) * DPI;
}

var imgWidthMM = 93.9;
var imgHeightMM = 67.31;
var imageWidth = mmToPx(imgWidthMM);
var imageHeight = mmToPx(imgHeightMM);

// Grid positions (3 x 6 = 18)
var xMM = [10.75, 105.75, 200.83];
var yMM = [28.7, 95.25, 161.62, 228.17, 294.72, 361.1];

var positions = [];
for (var j = 0; j < yMM.length; j++) {
    for (var i = 0; i < xMM.length; i++) {
        positions.push({
            x: mmToPx(xMM[i]),
            y: mmToPx(yMM[j]),
            width: imageWidth,
            height: imageHeight
        });
    }
}

// === SELECT IMAGE FOLDER ===
var sourceFolder = Folder.selectDialog("Select the folder containing PNG images to lay out");
if (!sourceFolder) {
    alert("No folder selected.");
} else {
    // Collect all PNG files recursively (including subfolders)
    function collectPngs(folder, outArray) {
        var items = folder.getFiles();
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (it instanceof File && /\.png$/i.test(it.name)) {
                outArray.push(it);
            } else if (it instanceof Folder) {
                collectPngs(it, outArray);
            }
        }
    }

    // Natural (alpha-numeric) compare: 1,2,3,10 instead of 1,10,2
    function compareAlphaNumeric(aName, bName) {
        var a = aName.toLowerCase();
        var b = bName.toLowerCase();

        var re = /(\d+)|(\D+)/g;
        var aParts = a.match(re);
        var bParts = b.match(re);

        var len = Math.min(aParts.length, bParts.length);
        for (var i = 0; i < len; i++) {
            var aa = aParts[i];
            var bb = bParts[i];

            // both numeric
            if (/^\d+$/.test(aa) && /^\d+$/.test(bb)) {
                var na = parseInt(aa, 10);
                var nb = parseInt(bb, 10);
                if (na < nb) return -1;
                if (na > nb) return 1;
            } else {
                if (aa < bb) return -1;
                if (aa > bb) return 1;
            }
        }

        // If all compared equal so far, shorter wins
        if (aParts.length < bParts.length) return -1;
        if (aParts.length > bParts.length) return 1;
        return 0;
    }

    var files = [];
    collectPngs(sourceFolder, files);

    // Sort primarily by folder path, then by filename using
    // natural (alpha-numeric) order, so cards from the same
    // subdirectory stay grouped and appear in a predictable order.
    files.sort(function (a, b) {
        var dirA = a.parent.fsName.toLowerCase();
        var dirB = b.parent.fsName.toLowerCase();
        if (dirA < dirB) return -1;
        if (dirA > dirB) return 1;
        return compareAlphaNumeric(a.name, b.name);
    });
    if (files.length === 0) {
        alert("No PNG files found in selected folder.");
    } else {
        var baseFile = File("E:/Marvel Champions/base-1.psd");
        if (!baseFile.exists) {
            alert("Base PSD not found.");
        } else {
            // Optional: choose a backup/filler card used when a sheet
            // has fewer than 18 images. Cancel to keep old repeat behavior.
            var backupFile = File.openDialog("Select backup PNG to use as filler (Cancel to repeat cards instead)", "*.png");

            var outputFolder = new Folder(sourceFolder.fsName + "/print-files");
            if (!outputFolder.exists) outputFolder.create();

            var batchCount = Math.ceil(files.length / 18);

            for (var b = 0; b < batchCount; b++) {
                var baseDoc = app.open(baseFile);

                // Create import group
                app.activeDocument = baseDoc;
                var importGroup = baseDoc.layerSets.add();
                importGroup.name = "Imported Images";

                // Collect up to 18 files for this batch
                var batchFiles = [];
                for (var i = 0; i < 18; i++) {
                    var index = b * 18 + i;
                    if (index >= files.length) break;
                    batchFiles.push(files[index]);
                }

                // Fill remaining slots on the sheet up to 18 cards
                while (batchFiles.length < 18) {
                    if (backupFile && backupFile.exists) {
                        batchFiles.push(backupFile);
                    } else {
                        // Fallback: repeat cards from the main list
                        batchFiles.push(files[batchFiles.length % files.length]);
                    }
                }

                // Process each file
                for (var i = 0; i < 18; i++) {
                    var f = batchFiles[i];
                    var data = positions[i];

                    var tempDoc = open(f);

                    tempDoc.rotateCanvas(90);
                    //tempDoc.rotateCanvas(-90); // counterclockwise instead

                    tempDoc.resizeImage(
                        UnitValue(data.width, "px"),
                        UnitValue(data.height, "px"),
                        null,
                        ResampleMethod.BICUBIC
                    );

                    tempDoc.selection.selectAll();
                    tempDoc.selection.copy();
                    tempDoc.close(SaveOptions.DONOTSAVECHANGES);

                    app.activeDocument = baseDoc;
                    baseDoc.paste();

                    var layer = baseDoc.activeLayer;
                    layer.move(importGroup, ElementPlacement.INSIDE);

                    baseDoc.selection.deselect();
                    app.tool = "moveTool";

                    var bounds = layer.bounds;
                    var dx = data.x - bounds[0].as("px");
                    var dy = data.y - bounds[1].as("px");

                    layer.translate(new UnitValue(dx, "px"), new UnitValue(dy, "px"));
                }

                // === EXPORT PNG ===
                var outFile = new File(outputFolder.fsName + "/layout_" + (b + 1) + ".png");

                var opts = new ExportOptionsSaveForWeb();
                opts.format = SaveDocumentType.PNG;
                opts.PNG8 = false;
                opts.transparency = false;
                opts.quality = 100;

                baseDoc.exportDocument(outFile, ExportType.SAVEFORWEB, opts);
                baseDoc.close(SaveOptions.DONOTSAVECHANGES);
            }

            alert("Export complete. " + batchCount + " file(s) saved to 'print-files'.");
        }
    }
}

//generated by chatgpt, tweaked by me