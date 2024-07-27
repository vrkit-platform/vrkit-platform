
Invoke-Command "
    protoc --ts_out ./packages/js/vrkit-native-interop/src/web/models --proto_path $PWD/packages/proto $PWD/packages/proto/*.proto
"