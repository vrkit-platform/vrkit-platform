setlocal
set rootDir=%0\..\..
pushd %rootDir%
set rootDir=%CD%
cd $rootDir


echo Building json-schema protos in %rootDir%

@rem Add protoc, python & go runtime environments to path
@rem NOTE: you must have `protoc-gen-jsonschema.exe` installed in `%USERPROFILE%/go/bin`
path %rootDir%\build\debug-ninja-new\vcpkg_installed\x64-windows-static\tools\protobuf;%rootDir%\venv\Scripts;%USERPROFILE%\go\bin;%path%

echo Starting json-schema protos in %rootDir%
protoc.exe -I %rootDir%\packages\proto --jsonschema_out=%rootDir%/etc/schema/models --jsonschema_opt=allow_null_values --jsonschema_opt=json_fieldnames %rootDir%\packages\proto\Geometry.proto %rootDir%\packages\proto\Screen.proto %rootDir%\packages\proto\OverlayLayout.proto
echo Completed json-schema protos in %rootDir%

popd
endlocal