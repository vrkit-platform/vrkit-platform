
$protoFiles = (Get-ChildItem -r -File $PWD/packages/proto  -Filter '*.proto').FullName

Invoke-Expression "protoc --ts_out ./packages/js/vrkit-models/src --proto_path $PWD/packages/proto $protoFiles"