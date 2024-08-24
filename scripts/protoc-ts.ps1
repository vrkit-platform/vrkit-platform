
param($protoCompiler)

if (-Not (Test-Path $protoCompiler)) {
    Write-Host "A single argument, which is the path to protoc.exe, is required"
    Exit 1
}

$env:PATH = "$PWD/node_modules/.bin;" + $env:PATH

$protoFiles = (Get-ChildItem -r -File $PWD/packages/proto  -Filter '*.proto').FullName

Invoke-Expression "$protoCompiler --ts_out ./packages/js/vrkit-models/src --proto_path $PWD/packages/proto $protoFiles"