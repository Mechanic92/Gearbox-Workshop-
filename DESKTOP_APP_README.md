# Gearbox Workshop - Desktop App

## 🚀 Quick Start

### Development Mode (Test the app)
```bash
# Terminal 1 - Start Vite dev server
npm run dev

# Terminal 2 - Start Electron
npm run electron:dev
```

The desktop app will open automatically with hot-reload enabled.

---

## 📦 Build Installer

### Create Windows .exe installer:
```bash
npm run electron:build-win
```

**Output:** `release/Gearbox Workshop-Setup-1.0.0.exe`

**Installer size:** ~150-200MB (includes Node.js runtime, all dependencies)

---

## ✨ Features

### Desktop App:
- ✅ **Offline-first** - Works without internet
- ✅ **Fast** - No network latency
- ✅ **System tray** - Minimize to tray, quick access
- ✅ **Auto-start backend** - Express server starts automatically
- ✅ **Local database** - SQLite in user data folder
- ✅ **Native feel** - Windows-native window controls

### Hybrid Mode:
- ✅ **Network access enabled** - Backend listens on `0.0.0.0:3000`
- ✅ **Mobile devices can connect** - Access via `http://192.168.1.6:5173`
- ✅ **Shared data** - Mobile sees same data as desktop
- ✅ **Real-time updates** - Changes sync instantly

---

## 📁 File Locations

### User Data:
- **Windows:** `C:\Users\[Username]\AppData\Roaming\Gearbox Workshop\`
- **Database:** `%APPDATA%\Gearbox Workshop\local.db`
- **Logs:** `%APPDATA%\Gearbox Workshop\logs\`

### Installation:
- **Default:** `C:\Program Files\Gearbox Workshop\`
- **Portable:** Can be installed anywhere

---

## 🌐 Network Access (Mobile/Tablet)

### When Desktop App is Running:

**From same WiFi network:**
1. Find your PC's IP: Run `ipconfig` in Command Prompt
2. On mobile device, open browser to: `http://YOUR_IP:5173`
3. Example: `http://192.168.1.6:5173`

**Features available on mobile:**
- ✅ View/create jobs
- ✅ Digital Vehicle Inspections (DVI)
- ✅ Customer management
- ✅ Real-time updates from desktop

---

## 🔧 System Tray Features

Right-click tray icon for:
- **Show Gearbox** - Restore window
- **Network Access** - Quick links to local/network URLs
- **Quit** - Close app completely

**Minimize to tray:** Click minimize button (app stays running in background)

---

## 🎯 Use Cases

### Office PC (Desktop App):
- Main data entry
- Invoicing and reporting
- Customer management
- Job scheduling

### Mobile (Network Access):
- Field technicians
- On-site inspections
- Quick job updates
- Photo uploads (DVI)

### Benefits:
- **Desktop:** Fast, reliable, offline-capable
- **Mobile:** Convenient field access when on-site
- **Hybrid:** Best of both worlds

---

## 🔄 Updates

### Auto-update (Future):
- App checks for updates on startup
- Downloads in background
- Prompts to install when ready
- No data loss during updates

### Manual update:
- Download new installer
- Run installer (overwrites old version)
- Database and settings preserved

---

## 🐛 Troubleshooting

### App won't start:
- Check Windows Event Viewer for errors
- Delete `%APPDATA%\Gearbox Workshop\` and reinstall
- Run as Administrator

### Mobile can't connect:
- Ensure desktop app is running
- Check Windows Firewall allows ports 3000 and 5173
- Verify both devices on same WiFi network
- Try `http://localhost:5173` on desktop first

### Database issues:
- Database location: `%APPDATA%\Gearbox Workshop\local.db`
- Backup before troubleshooting
- Delete database to start fresh (loses all data)

### Performance issues:
- Close other Electron apps (Discord, Slack, etc.)
- Check Task Manager for high CPU/memory usage
- Restart app

---

## 📊 Technical Details

### Stack:
- **Frontend:** React + Vite
- **Backend:** Express + tRPC
- **Database:** SQLite (better-sqlite3)
- **Desktop:** Electron 28+
- **Build:** electron-builder

### Ports:
- **Frontend:** 5173 (Vite dev server / bundled in production)
- **Backend:** 3000 (Express API)
- **Network:** Listens on `0.0.0.0` (all interfaces)

### Security:
- Context isolation enabled
- Node integration disabled
- Preload script for safe IPC
- Local-only by default (network optional)

---

## 🎨 Customization

### Change app icon:
1. Replace `build/icon.ico` with your icon (256x256 recommended)
2. Replace `build/tray-icon.ico` for system tray
3. Rebuild: `npm run electron:build-win`

### Change app name:
1. Edit `package.json`: `"productName": "Your Name"`
2. Edit `electron-builder.json`: `"productName": "Your Name"`
3. Rebuild

---

## 📝 Distribution

### Share with employees:
1. Build installer: `npm run electron:build-win`
2. Upload `release/Gearbox Workshop-Setup-1.0.0.exe` to shared drive
3. Employees download and install
4. Each installation has separate database (per-machine)

### Future: Cloud sync (optional):
- Sync databases between installations
- Multi-location support
- Backup to cloud storage
- Requires additional setup

---

## ✅ Next Steps

1. **Test in dev mode:** `npm run electron:dev`
2. **Build installer:** `npm run electron:build-win`
3. **Install on your PC**
4. **Test mobile access** from phone
5. **Add AI features** (next phase)
6. **Distribute to team**

---

## 🆘 Support

For issues or questions:
1. Check this README
2. Review console logs (F12 in dev mode)
3. Check `%APPDATA%\Gearbox Workshop\logs\`

---

**You now have a production-ready desktop app with mobile access!** 🎉
