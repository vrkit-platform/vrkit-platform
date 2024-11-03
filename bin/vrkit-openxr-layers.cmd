@rem "%~dp0\..\node_modules\.bin\ts-node.cmd"
@echo off
node -r ts-node/register  "%~dp0\..\scripts\vrkit-openxr-layers.ts" %*