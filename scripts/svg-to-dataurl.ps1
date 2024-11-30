param($svgFile)

if (-Not (Test-Path $svgFile)) {
    Write-Host "A single argument, which is the path to an SVG file, is required"
    Exit 1
}


$imgUrlData = (base64 $svgFile)
$imgUrl = "data:image/svg+xml;base64,$imgUrlData"

Write-Output $imgUrl | Set-Clipboard

Write-Output $imgUrl
