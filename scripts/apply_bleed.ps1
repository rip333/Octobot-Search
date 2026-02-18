# This script requires ImageMagick

param(
    # Hardcoded defaults for your folder structure.
    [string]$SourceRoot = "your_path_here",
    [string]$OutputRoot = "your_output_path_here"
)

$CARD_IMAGES_PATH = $SourceRoot
$OUTPUT_PATH = $OutputRoot

if (-not (Test-Path -LiteralPath $CARD_IMAGES_PATH)) {
    throw "SourceRoot does not exist: '$CARD_IMAGES_PATH'"
}

# Create output directory
if (-not (Test-Path -LiteralPath $OUTPUT_PATH)) {
    New-Item -ItemType Directory -Path $OUTPUT_PATH -Force | Out-Null
}

# Get all image files under the current directory (including subfolders),
# but ignore anything already inside the output/bleed folder
$images = Get-ChildItem -Path $CARD_IMAGES_PATH -Recurse -File -Include *.png,*.jpg,*.jpeg,*.gif,*.bmp |
    Where-Object { -not $_.FullName.StartsWith($OUTPUT_PATH, [System.StringComparison]::OrdinalIgnoreCase) }

$count = 0
$total = $images.Count

Write-Host "Found $total images to process"
Write-Host ""

foreach ($file in $images) {
    $count++

    # Calculate relative path (from the input root) so we can mirror
    # the folder structure under the bleed output folder.
    $relativePath = $file.FullName.Substring($CARD_IMAGES_PATH.Length + 1)
    $relativeDir = Split-Path $relativePath -Parent

    if (![string]::IsNullOrEmpty($relativeDir)) {
        $outputDir = Join-Path $OUTPUT_PATH $relativeDir
        if (-not (Test-Path -LiteralPath $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
    } else {
        $outputDir = $OUTPUT_PATH
    }

    # Output file path
    $outputFile = Join-Path $outputDir ("bleed_" + $file.BaseName + ".png")

    if (Test-Path -LiteralPath $outputFile) {
        Write-Host "[$count/$total] Skipping: $($file.Name) (bleed already exists)"
        continue
    }

    # Process the image
    Write-Host "[$count/$total] Processing: $($file.Name)"
    
    & magick $file.FullName `
        -units PixelsPerInch `
        -density 300 `
        -resize "744x1038!" `
        -define "distort:viewport=816x1110-36-36" `
        -virtual-pixel Mirror `
        -distort SRT 0 `
        +repage `
        $outputFile
}

Write-Host ""
Write-Host "All files processed. Bleed images saved to '$OUTPUT_PATH'"
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
