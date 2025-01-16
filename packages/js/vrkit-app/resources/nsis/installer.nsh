; !macro customHeader
;   !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
; !macroend

; !macro preInit
;   ; This macro is inserted at the beginning of the NSIS .OnInit callback
;   !system "echo '' > ${BUILD_RESOURCES_DIR}/preInit"
; !macroend

; !macro customInit
;   !system "echo '' > ${BUILD_RESOURCES_DIR}/customInit"
; !macroend

; Section "DirectX" DirectX
;     SetOutPath "$INSTDIR\Redist"
;     File "redist\directx\dxwebsetup.exe"
;     DetailPrint "Running DirectX Setup..."
;     ExecWait "$INSTDIR\Redist\dxwebsetup.exe"
;     DetailPrint "Finished DirectX Setup"
;   SectionEnd

!macro customInstall
  ClearErrors
  DetailPrint "Running VC++ Runtime Setup..."
  ExecWait '"$INSTDIR\resources\redist\VC_redist.x64.exe" /install /passive /norestart' $0
  ${If} ${Errors}
    MessageBox mb_iconstop "Failed to install Visual C++ runtime"
    Quit
  ${EndIf}
  DetailPrint "Finished VC++ Runtime Setup"

  ClearErrors
  DetailPrint "Running DirectX Runtime Setup..."
  ExecWait '"$INSTDIR\resources\redist\dxwebsetup.exe" /Q'
  ${If} ${Errors}
    MessageBox mb_iconstop "Failed to install DirectX runtime"
    Quit
  ${EndIf}
  DetailPrint "Finished DirectX Runtime Setup"

  ClearErrors
  DetailPrint "Running DotNet Runtime Setup..."
  ExecWait '"$INSTDIR\resources\redist\dotnet-windowsdesktop-runtime-8.0.11-win-x64.exe" /install /passive /norestart'
  ${If} ${Errors}
    MessageBox mb_iconstop "Failed to install .NET runtime"
    Quit
  ${EndIf}
  DetailPrint "Finished DotNet Runtime Setup"

  ClearErrors
  DetailPrint "Running Windows App Runtime Setup..."
  ExecWait '"$INSTDIR\resources\redist\Microsoft.WindowsAppRuntime.Redist.1.6.241114003\WindowsAppSDK-Installer-x64\WindowsAppRuntimeInstall-x64.exe" -q'
  ${If} ${Errors}
    MessageBox mb_iconstop "Failed to install Windows App runtime"
    Quit
  ${EndIf}
  DetailPrint "Finished Windows App Runtime Setup"
  ClearErrors
!macroend

; !macro customInstallMode
;   # set $isForceMachineInstall or $isForceCurrentInstall
;   # to enforce one or the other modes.
; !macroend

; !macro customWelcomePage
;   # Welcome Page is not added by default for installer.
;   !insertMacro MUI_PAGE_WELCOME
; !macroend

; !macro customUnWelcomePage
;   !define MUI_WELCOMEPAGE_TITLE "custom title for uninstaller welcome page"
;   !define MUI_WELCOMEPAGE_TEXT "custom text for uninstaller welcome page $\r$\n more"
;   !insertmacro MUI_UNPAGE_WELCOME
; !macroend