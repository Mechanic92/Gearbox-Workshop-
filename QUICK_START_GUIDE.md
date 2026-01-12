# 🚀 Gearbox Workshop - Quick Start Guide

## You Have 3 Options:

---

## Option 1: Desktop App (Recommended for Daily Use)

### Build the installer:
```bash
# Double-click this file:
BUILD_DESKTOP_APP.bat
```

**What you get:**
- `release/Gearbox Workshop-Setup-1.0.0.exe` (~150MB)
- One-click installer
- Works offline
- System tray integration
- Mobile access still works when app is running

### Install and use:
1. Double-click the installer
2. Follow installation wizard
3. Launch from Start Menu
4. Complete setup wizard (create ledger)
5. Start managing your workshop!

**Mobile access:** When desktop app is running, access from phone at `http://192.168.1.6:5173`

---

## Option 2: Test Desktop App (Before Building)

### Test in development mode:
```bash
# Double-click this file:
TEST_DESKTOP_APP.bat
```

**What happens:**
- Vite dev server starts
- Electron window opens
- Hot-reload enabled (changes update instantly)
- Perfect for testing before building installer

---

## Option 3: Web Version (Current Setup)

### Run locally:
```bash
# Double-click this file:
QUICK_START.bat
```

**What you get:**
- Backend on port 3000
- Frontend on port 5173
- Access at: http://localhost:5173
- Mobile access: http://192.168.1.6:5173

---

## Which Should You Use?

### Desktop App (Option 1):
✅ **Best for:** Daily use, production environment  
✅ **Pros:** Fast, offline, reliable, professional  
✅ **Cons:** Need to build installer first (~5 min)

### Test Desktop (Option 2):
✅ **Best for:** Testing desktop app before building  
✅ **Pros:** Quick to start, hot-reload  
✅ **Cons:** Requires terminal windows open

### Web Version (Option 3):
✅ **Best for:** Quick testing, development  
✅ **Pros:** No build needed, familiar browser interface  
✅ **Cons:** Requires PC on, two terminal windows

---

## Recommended Workflow:

### Phase 1: Initial Testing (Now)
Use **Option 3 (Web Version)** to test with real jobs for 1-2 days

### Phase 2: Desktop App Testing
Use **Option 2 (Test Desktop)** to verify desktop app works correctly

### Phase 3: Production Use
Build with **Option 1 (Desktop App)** and use daily

---

## Mobile Access (All Options)

When any version is running, access from phone/tablet:

1. **Find your PC's IP:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.6)

2. **On mobile device (same WiFi):**
   Open browser to: `http://192.168.1.6:5173`

3. **Features on mobile:**
   - View/create jobs
   - Digital Vehicle Inspections (DVI)
   - Customer management
   - Real-time updates

---

## Next Steps After Setup:

1. ✅ **Test with real jobs** - Use it for actual work
2. ✅ **Validate workflow** - Ensure it fits your process
3. ✅ **Add AI features** - Free AI enhancements (next phase)
4. ✅ **Train team** - Show employees how to use it
5. ✅ **Go live** - Replace old systems

---

## Support Files:

- `DESKTOP_APP_README.md` - Full desktop app documentation
- `ACCESS_NOW.md` - Web version access guide
- `TROUBLESHOOT.md` - Common issues and fixes

---

## 🎉 You're Ready!

**Start with Option 3 (Web Version) right now:**
```bash
# Just double-click:
QUICK_START.bat
```

Test it with real jobs today, then build the desktop app when you're ready for production use.
