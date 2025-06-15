@echo off

REM This script requires ImageMagick, found at https://imagemagick.org/script/download.php

if [%1]==[] goto :eof

mkdir "Bleeds"

:loop
echo Adding bleed to %~nx1...
magick %1 -units PixelsPerInch -density 300 -resize 744x1038! -define distort:viewport=816x1110-36-36 -virtual-pixel Mirror -distort SRT 0 +repage "Bleeds/bleed_%~n1.png"
echo Saving as bleed_%~n1.png...
shift

if not [%1]==[] goto loop

pause

@echo on