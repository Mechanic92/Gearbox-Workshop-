const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Simple PowerShell zipper as fallback if NSIS missing
const createZip = () => {
    console.log("Creating ZIP installer...");
    try {
        execSync(`powershell -Command "Compress-Archive -Path 'dist-electron\\gearbox-fintech-rebuilt-win32-x64\\*' -DestinationPath 'Gearbox-Setup-v1.0.0.zip' -Force"`, { stdio: 'inherit' });
        console.log("ZIP created successfully: Gearbox-Setup-v1.0.0.zip");
    } catch (e) {
        console.error("Failed to create ZIP:", e);
    }
};

const script = `
!include "MUI2.nsh"
Name "Gearbox Workshop"
OutFile "Gearbox-Setup-v1.0.0.exe"
InstallDir "$LOCALAPPDATA\\GearboxWorkshop"
RequestExecutionLevel user

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist-electron\\gearbox-fintech-rebuilt-win32-x64\\*"
  
  CreateShortcut "$DESKTOP\\Gearbox Workshop.lnk" "$INSTDIR\\gearbox-fintech-rebuilt.exe"
  CreateShortcut "$SMPROGRAMS\\Gearbox Workshop.lnk" "$INSTDIR\\gearbox-fintech-rebuilt.exe"
  
  WriteUninstaller "$INSTDIR\\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\\uninstall.exe"
  Delete "$INSTDIR\\*"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\\Gearbox Workshop.lnk"
  Delete "$SMPROGRAMS\\Gearbox Workshop.lnk"
SectionEnd
`;

fs.writeFileSync("install.nsi", script);

// Try to find makensis
const possiblePaths = [
    "C:\\Program Files (x86)\\NSIS\\makensis.exe",
    "C:\\Program Files\\NSIS\\makensis.exe",
    path.join(process.cwd(), "node_modules", "nsis-bin", "bin", "makensis.exe") // If configured
];

let nsisPath = possiblePaths.find(p => fs.existsSync(p));

if (nsisPath) {
    console.log(`Found NSIS at ${nsisPath}, building installer...`);
    try {
        execSync(`"${nsisPath}" install.nsi`, { stdio: "inherit" });
        console.log("Installer created: Gearbox-Setup-v1.0.0.exe");
    } catch (e) {
        console.error("NSIS build failed, falling back to ZIP");
        createZip();
    }
} else {
    console.log("NSIS not found locally. Creating ZIP archive as universal installer.");
    createZip();
}
