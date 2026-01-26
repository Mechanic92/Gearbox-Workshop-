
!include "MUI2.nsh"
Name "Gearbox Workshop"
OutFile "Gearbox-Setup-v1.0.0.exe"
InstallDir "$LOCALAPPDATA\GearboxWorkshop"
RequestExecutionLevel user

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist-electron\gearbox-fintech-rebuilt-win32-x64\*"
  
  CreateShortcut "$DESKTOP\Gearbox Workshop.lnk" "$INSTDIR\gearbox-fintech-rebuilt.exe"
  CreateShortcut "$SMPROGRAMS\Gearbox Workshop.lnk" "$INSTDIR\gearbox-fintech-rebuilt.exe"
  
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\uninstall.exe"
  Delete "$INSTDIR\*"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\Gearbox Workshop.lnk"
  Delete "$SMPROGRAMS\Gearbox Workshop.lnk"
SectionEnd
