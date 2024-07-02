Get-ChildItem build | ForEach-Object {
  $pbPath = $_.FullName + "\packages\proto\IRacingTools"
  echo "Checking $pbPath"
  
  if (Test-Path -Path $pbPath) {
    echo "Removing $pbPath"
    rm -Recurse -Force $pbPath

    Push-Location $_.FullName
    echo "Rebuilding Models Static Lib " $_.FullName
    cmake --build . --target iracing_tools_models_static
    Pop-Location
  }
}




