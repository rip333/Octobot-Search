// Lays out card BACKS on 3x6 sheets for the 61o5x88 print template.
//
// Run from Photoshop: File > Scripts > Browse, then pick this file.
// Configure the base PSD once in champions-grid-config.json (see README.md).

#include "./champions-grid-common.jsx"

runChampionsGrid({
    sheetName: "back",
    // Right to left: mirrors the fronts so duplex printing registers.
    columnOrderMM: [200.83, 105.75, 10.75],
    // Counter-clockwise, the mirror of the fronts rotation.
    rotation: -90,
    // Backs repeat the source cards rather than using a filler.
    offerFiller: false,
    scriptFile: new File($.fileName)
});
