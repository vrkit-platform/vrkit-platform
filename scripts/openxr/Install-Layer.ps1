$RegistryPath = "HKLM:\Software\Khronos\OpenXR\1\ApiLayers\Implicit"

$RootPath = Resolve-Path (Join-Path "$PSScriptRoot" ".." "..")
$OpenXRLayerPath = Join-Path "$RootPath" "packages" "cpp" "openxr-lib"

Write-Output "$RootPath"
Write-Output "$OpenXRLayerPath"

$JsonPath = Join-Path "$OpenXRLayerPath" "openxr-api-layer.json"
Start-Process -FilePath powershell.exe -Verb RunAs -Wait -ArgumentList @"
	& {
		If (-not (Test-Path $RegistryPath)) {
			New-Item -Path $RegistryPath -Force | Out-Null
		}
		New-ItemProperty -Path $RegistryPath -Name '$jsonPath' -PropertyType DWord -Value 0 -Force | Out-Null
	}
"@
