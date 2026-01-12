# Gearbox Desktop App - Implementation Plan

## What You'll Get

### Deliverable:
- **GearboxWorkshop.exe** (~150MB)
- Portable installer (no admin rights needed)
- Auto-updates built-in
- System tray integration
- Native Windows notifications

### Features:
- ✅ All current features (jobs, customers, invoicing, DVI, etc.)
- ✅ Works 100% offline
- ✅ SQLite database stored locally
- ✅ Dark/neon theme preserved
- ✅ Faster than web version
- ✅ No browser required

---

## Technical Implementation

### Stack:
- **Electron** - Desktop wrapper
- **Existing React frontend** - No changes needed
- **Existing Express backend** - Bundled inside
- **SQLite database** - Stored in user data folder

### File Structure:
```
GearboxWorkshop/
├── GearboxWorkshop.exe          # Main executable
├── resources/
│   ├── app.asar                 # Bundled app code
│   └── icon.ico                 # App icon
└── data/
    └── local.db                 # Database (auto-created)
```

### User Data Location:
- Windows: `C:\Users\[Username]\AppData\Roaming\GearboxWorkshop\`
- Database: `%APPDATA%\GearboxWorkshop\local.db`
- Logs: `%APPDATA%\GearboxWorkshop\logs\`

---

## Build Process

### 1. Install Electron Dependencies
```bash
npm install --save-dev electron electron-builder
npm install electron-is-dev
```

### 2. Create Electron Main Process
- `electron/main.js` - Window management, backend startup
- `electron/preload.js` - Security bridge
- Auto-start Express server on app launch

### 3. Update package.json
```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "electron .",
    "electron:build": "electron-builder"
  },
  "build": {
    "appId": "com.gearbox.workshop",
    "productName": "Gearbox Workshop",
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    }
  }
}
```

### 4. Build Executable
```bash
npm run build              # Build React frontend
npm run electron:build     # Package as .exe
```

Output: `dist/GearboxWorkshop Setup 1.0.0.exe`

---

## Distribution

### Initial Install:
1. Download `GearboxWorkshop-Setup.exe`
2. Double-click to install
3. App opens automatically
4. Complete setup wizard (create ledger)
5. Start using

### Updates:
- Auto-update built-in (electron-updater)
- Checks for updates on startup
- Downloads in background
- Prompts to restart when ready

---

## Advantages Over Web Version

| Feature | Desktop App | Web Version |
|:---|:---:|:---:|
| **Offline Access** | ✅ | ❌ |
| **Speed** | ⚡ Instant | 🐌 Network delay |
| **Installation** | One-time | None needed |
| **Updates** | Auto | Auto |
| **Cost** | Free forever | Hosting fees |
| **Data Privacy** | Local only | Cloud storage |
| **Multi-user** | Per-machine | Shared |
| **Mobile Access** | ❌ | ✅ |

---

## Hybrid Approach (Recommended)

### Best of Both Worlds:
1. **Desktop app for main office PC**
   - Fast, reliable, offline-capable
   - Primary data entry and management

2. **Keep local network access for mobile**
   - Technicians use phones/tablets on-site
   - Access via `http://192.168.1.6:5173` (when desktop app running)
   - Real-time updates

3. **Optional cloud sync (future)**
   - Sync database to cloud periodically
   - Multi-location support
   - Backup/disaster recovery

---

## Implementation Time

- **Setup Electron:** 1 hour
- **Configure build:** 30 minutes
- **Test packaging:** 30 minutes
- **Create installer:** 30 minutes
- **Documentation:** 30 minutes

**Total: ~3 hours**

---

## Next Steps

If you want the desktop app:
1. I'll set up Electron configuration
2. Create build scripts
3. Package the .exe
4. Test installation
5. Provide you with installer

**Ready to proceed?**
