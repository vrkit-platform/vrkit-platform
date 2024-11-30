param($protoCompiler)

if (-Not (Test-Path $protoCompiler)) {
    Write-Host "A single argument, which is the path to protoc.exe, is required"
    Exit 1
}

$rootDir = "$PWD"
$env:PATH = "$rootDir/node_modules/.bin;" + $env:PATH


Write-Output "Using root: $rootDir"
#pushd %rootDir%
#set rootDir=%CD%
#cd $rootDir


Write-Output "Building json-schema protos in $rootDir"
$protoFiles = (Get-ChildItem -r -File $rootDir/packages/proto  -Filter '*.proto').FullName

#@rem Add protoc, python & go runtime environments to path
#@rem NOTE: you must have `protoc-gen-jsonschema.exe` installed in `%USERPROFILE%/go/bin`
#@rem path %rootDir%\build\debug-ninja-new\vcpkg_installed\x64-windows-static\tools\protobuf;%rootDir%\venv\Scripts;%USERPROFILE%\go\bin;%path%
#path %rootDir%\build\debug-clion-ninja-new\vcpkg_installed\x64-windows-static\tools\protobuf;%rootDir%\venv\Scripts;%USERPROFILE%\go\bin;%path%

Write-Output "Starting json-schema protos in $rootDir"
Invoke-Expression "$protoCompiler -I $rootDir/packages/proto --jsonschema_out=$rootDir/etc/schema/models --jsonschema_opt=allow_null_values --jsonschema_opt=json_fieldnames $protoFiles"
Write-Output "Completed json-schema protos in $rootDir"

