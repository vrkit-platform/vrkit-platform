$RegistryPath = "HKLM:\Software\Khronos\OpenXR\1\ApiLayers\Implicit"

$RootPath = Resolve-Path (Join-Path "$PSScriptRoot" ".." "..")
$OpenXRLayerPath = Join-Path "$RootPath" "packages" "cpp" "lib-openxr-layer"

Write-Output "$RootPath"
Write-Output "$OpenXRLayerPath"

$JsonPath = Join-Path "$OpenXRLayerPath" "openxr-api-layer.json"

Start-Process -FilePath powershell.exe -Verb RunAs -Wait -ArgumentList @"
	& {
		Remove-ItemProperty -Path HKLM:\Software\Khronos\OpenXR\1\ApiLayers\Implicit -Name '$jsonPath' -Force | Out-Null
	}
"@
