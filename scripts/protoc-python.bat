setlocal
set rootDir=%0\..\..
pushd %rootDir%
set rootDir=%CD%
cd $rootDir


echo Building python protos in %rootDir%

path %rootDir%\vcpkg_installed\x64-windows\tools\protobuf;%rootDir%\venv\Scripts;%path%

echo Starting python protos in %rootDir%
protoc.exe -I %rootDir%\packages\proto --python_out=%rootDir%/packages/python/irsdk/models --mypy_out=%rootDir%/packages/python/irsdk/models %rootDir%\packages\proto\LapData.proto
echo Completed python protos in %rootDir%

popd
endlocal