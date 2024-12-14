param(
    [Parameter(Mandatory=$true)][string]$File,
    [Parameter(Mandatory=$true)][string]$Format = "svg+xml"

)
if (-Not (Test-Path $File)) {
    Write-Host "ImgFile is required"
    Exit 1
}


$imgUrlData = (base64 $File)
$imgUrl = "data:image/$Format;base64,$imgUrlData"

Write-Output $imgUrl | Set-Clipboard

#Write-Output $imgUrl
