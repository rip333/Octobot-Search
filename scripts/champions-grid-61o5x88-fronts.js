// Lays out card FRONTS on 3x6 sheets for the 61o5x88 print template.
//
// Run from Photoshop: File > Scripts > Browse, then pick this file.
// Configure the base PSD once in champions-grid-config.json (see README.md).

#include "./champions-grid-common.jsx"

runChampionsGrid({
    sheetName: "front",
    // Left to right: fronts read in normal reading order.
    columnOrderMM: [10.75, 105.75, 200.83],
    // Clockwise, so landscape card art stands upright on the sheet.
    rotation: 90,
    // Fronts may be padded with a chosen filler card; backs never are.
    offerFiller: true,
    scriptFile: new File($.fileName)
});
