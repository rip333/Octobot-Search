<#
.SYNOPSIS
    Adds a mirrored print bleed to every card image under a source folder.

.DESCRIPTION
    Requires ImageMagick 7 (`magick`) on PATH: https://imagemagick.org/script/download.php

    Output mirrors the source folder structure. Existing bleeds are skipped, so
    reruns are cheap and never clobber earlier output.

.PARAMETER SourceRoot
    Folder to scan recursively. Prompts when omitted.

.PARAMETER OutputRoot
    Folder to write bleeds into. Defaults to "<SourceRoot>\bleeds".

.PARAMETER Force
    Overwrite existing bleed files instead of skipping them.

.PARAMETER NoPause
    Skip the final keypress. Set automatically when the session is
    non-interactive, so this script is safe to call from another script.

.EXAMPLE
    .\apply_bleed.ps1 -SourceRoot 'D:\cards' -OutputRoot 'D:\cards\bleeds' -NoPause
#>

[CmdletBinding()]
param(
    [string]$SourceRoot,
    [string]$OutputRoot,
    [switch]$Force,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'

# --- ImageMagick availability -------------------------------------------------
$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) {
    throw "ImageMagick 'magick' was not found on PATH. Install it from https://imagemagick.org/script/download.php"
}

# --- Resolve paths canonically ------------------------------------------------
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
    if ($NoPause) { throw "SourceRoot is required when running non-interactively." }
    $SourceRoot = Read-Host "Folder containing card images"
}

if (-not (Test-Path -LiteralPath $SourceRoot)) {
    throw "SourceRoot does not exist: '$SourceRoot'"
}

# Canonical full paths, so the "is this already output?" test below is reliable
# regardless of how the caller spelled the path.
$sourcePath = (Resolve-Path -LiteralPath $SourceRoot).ProviderPath.TrimEnd('\')

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $sourcePath 'bleeds'
}

if (-not (Test-Path -LiteralPath $OutputRoot)) {
    New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
}
$outputPath = (Resolve-Path -LiteralPath $OutputRoot).ProviderPath.TrimEnd('\')

if ($sourcePath -ieq $outputPath) {
    throw "OutputRoot must differ from SourceRoot; otherwise each run would re-ingest its own output."
}

# --- Collect input ------------------------------------------------------------
# Excluding anything under the output root keeps reruns from bleeding the bleeds.
$outputPrefix = $outputPath + '\'
$images = Get-ChildItem -LiteralPath $sourcePath -Recurse -File -Include *.png, *.jpg, *.jpeg, *.gif, *.bmp |
    Where-Object { -not $_.FullName.StartsWith($outputPrefix, [System.StringComparison]::OrdinalIgnoreCase) }

$total = @($images).Count
Write-Host "Found $total image(s) to process"

if ($total -eq 0) { return }

$processed = 0
$skipped = 0
$failed = @()
$count = 0
# Output names drop the source extension, so `card.png` and `card.jpg` in one
# folder would both want `bleed_card.png`. Track what this run has claimed.
$claimedOutputs = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)

foreach ($file in $images) {
    $count++

    # Mirror the source folder structure under the output root.
    $relativePath = $file.FullName.Substring($sourcePath.Length + 1)
    $relativeDir = Split-Path $relativePath -Parent

    if ([string]::IsNullOrEmpty($relativeDir)) {
        $outputDir = $outputPath
    } else {
        $outputDir = Join-Path $outputPath $relativeDir
        if (-not (Test-Path -LiteralPath $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
    }

    $outputFile = Join-Path $outputDir ("bleed_" + $file.BaseName + ".png")

    # Disambiguate rather than silently overwriting a sibling processed earlier
    # in this same run.
    if (-not $claimedOutputs.Add($outputFile)) {
        $suffix = $file.Extension.TrimStart('.').ToLowerInvariant()
        $outputFile = Join-Path $outputDir ("bleed_" + $file.BaseName + "_" + $suffix + ".png")
        [void]$claimedOutputs.Add($outputFile)
        Write-Warning "Name collision for '$($file.Name)'; writing '$(Split-Path $outputFile -Leaf)' instead."
    }

    if ((Test-Path -LiteralPath $outputFile) -and -not $Force) {
        Write-Host "[$count/$total] Skipping: $($file.Name) (bleed already exists)"
        $skipped++
        continue
    }

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

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "magick exited with $LASTEXITCODE for '$($file.FullName)'"
        $failed += $file.FullName
        continue
    }

    if (-not (Test-Path -LiteralPath $outputFile)) {
        Write-Warning "magick reported success but wrote nothing for '$($file.FullName)'"
        $failed += $file.FullName
        continue
    }

    $processed++
}

Write-Host ""
Write-Host "Processed $processed, skipped $skipped, failed $($failed.Count). Output: '$outputPath'"

if ($failed.Count -gt 0) {
    $failed | ForEach-Object { Write-Warning "Failed: $_" }
    exit 1
}

# Only pause when a human is watching.
if (-not $NoPause -and $Host.UI.RawUI -and -not [Console]::IsInputRedirected) {
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
