@echo off
setlocal enabledelayedexpansion

REM Adds a mirrored print bleed to each image passed as an argument
REM (drag-and-drop onto this file, or call with paths).
REM
REM Requires ImageMagick 7: https://imagemagick.org/script/download.php
REM
REM Existing output is never overwritten: an already-bled file is skipped, and
REM two sources that differ only by extension get distinct output names.
REM
REM Set BLEED_NOPAUSE=1 to skip the final pause when calling from another script.

if "%~1"=="" (
    echo Usage: %~nx0 image1 [image2 ...]
    echo Drag image files onto this script, or pass paths as arguments.
    if not "%BLEED_NOPAUSE%"=="1" pause
    exit /b 2
)

where magick >nul 2>&1
if errorlevel 1 (
    echo ERROR: ImageMagick 'magick' was not found on PATH.
    echo Install it from https://imagemagick.org/script/download.php
    if not "%BLEED_NOPAUSE%"=="1" pause
    exit /b 3
)

REM Write next to the first input file rather than the current directory, so
REM output lands somewhere predictable no matter where the script was invoked.
set "OUTDIR=%~dp1Bleeds"
if not exist "%OUTDIR%" mkdir "%OUTDIR%"
if not exist "%OUTDIR%" (
    echo ERROR: could not create output folder "%OUTDIR%".
    if not "%BLEED_NOPAUSE%"=="1" pause
    exit /b 4
)

set /a FAILED=0
set /a DONE=0
set /a SKIPPED=0
REM Names claimed during THIS run, delimited so substring tests are exact.
REM Distinguishes "a sibling just took this name" from "a previous run did".
set "CLAIMED=|"

:loop
if "%~1"=="" goto done

if not exist "%~1" (
    echo   SKIP: %~nx1 does not exist.
    set /a FAILED+=1
    shift
    goto loop
)

set "BASE=bleed_%~n1"
set "KEY=|%~n1|"
set "OUTFILE=%OUTDIR%\!BASE!.png"

REM Claimed earlier in this run means a genuine collision between two sources,
REM so disambiguate with the source extension rather than overwrite.
if "!CLAIMED:%KEY%=!" neq "!CLAIMED!" (
    set "EXT=%~x1"
    set "EXT=!EXT:.=!"
    set "OUTFILE=%OUTDIR%\!BASE!_!EXT!.png"
    echo Name collision for %~nx1; writing !BASE!_!EXT!.png instead.

    if exist "!OUTFILE!" (
        echo   SKIP: !BASE!_!EXT!.png already exists.
        set /a SKIPPED+=1
        shift
        goto loop
    )
) else (
    set "CLAIMED=!CLAIMED!%~n1|"

    REM Not claimed this run, so an existing file is finished work from before.
    if exist "!OUTFILE!" (
        echo   SKIP: !BASE!.png already exists.
        set /a SKIPPED+=1
        shift
        goto loop
    )
)

echo Adding bleed to %~nx1...
magick "%~1" -units PixelsPerInch -density 300 -resize 744x1038! -define distort:viewport=816x1110-36-36 -virtual-pixel Mirror -distort SRT 0 +repage "!OUTFILE!"

if errorlevel 1 (
    echo   FAILED: magick returned errorlevel !errorlevel! for %~nx1
    set /a FAILED+=1
) else (
    if exist "!OUTFILE!" (
        set /a DONE+=1
    ) else (
        echo   FAILED: magick wrote no output for %~nx1
        set /a FAILED+=1
    )
)

shift
goto loop

:done
echo.
echo Processed !DONE!, skipped !SKIPPED!, failed !FAILED!. Output: "%OUTDIR%"
if not "%BLEED_NOPAUSE%"=="1" pause
if !FAILED! gtr 0 exit /b 1
exit /b 0
