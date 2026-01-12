# 🚀 ACCESS YOUR GEARBOX APP NOW

## FASTEST WAY TO START (30 SECONDS)

### Double-click this file:
```
QUICK_START.bat
```
This will:
1. Start the backend server
2. Start the frontend
3. Open your browser automatically

**Access URL:** http://localhost:5173

---

## FOR REMOTE ACCESS (Phone, Tablet, Other Computer)

### Option 1: ngrok (Public URL - 2 minutes)
1. Download ngrok: https://ngrok.com/download
2. Extract and run:
   ```bash
   ngrok http 5173
   ```
3. Copy the URL (e.g., `https://abc123.ngrok-free.app`)
4. Access from anywhere in the world

### Option 2: Local Network (Same WiFi)
1. Find your computer's IP:
   - Open Command Prompt
   - Type: `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)
2. On your phone/tablet (same WiFi):
   - Open browser
   - Go to: `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`

**Note:** You may need to allow port 5173 in Windows Firewall

---

## WHAT'S READY TO USE RIGHT NOW

### ✅ Core Features (All Working)
- **Dashboard** - Business overview, metrics, profit tracking
- **Jobs** - Create, track, update jobs with full workflow
- **Customers** - Complete customer management
- **Vehicles** - Vehicle profiles and history
- **DVI** - Digital Vehicle Inspections with photos
- **Invoicing** - Generate professional invoices
- **Bookings** - Schedule appointments with calendar
- **Cost Tracking** - Labor, parts, overhead allocation
- **Mobile View** - Technician interface for field work

### 🎨 Design
- Dark theme with neon green accents
- Glass morphism effects
- Smooth animations
- Fully responsive (desktop, tablet, mobile)

### 💾 Data Storage
- Everything saves to local SQLite database
- Location: `local.db` in project folder
- No internet required for core features
- Your data stays on your computer

---

## TEST WITH YOUR REAL JOBS TODAY

### Quick Workflow:
1. **Create a Customer**
   - Dashboard → Customers → New Customer
   - Add name, phone, email

2. **Add Their Vehicle**
   - Customers → Select customer → Add Vehicle
   - Enter make, model, plate, VIN

3. **Create a Job**
   - Dashboard → New Job
   - Select customer & vehicle
   - Enter job description
   - Set quoted price

4. **Track Costs**
   - Open job → Allocate Resource
   - Add labor hours, parts, overhead
   - Watch profit margin update in real-time

5. **Generate Invoice**
   - Job detail → Invoicing button
   - Review and download PDF

6. **Complete Job**
   - Update status to "Completed"
   - View in dashboard metrics

---

## AUTHENTICATION

**Currently:** Mock authentication (auto-logged in as owner)
- No login required
- Full access to all features
- Perfect for testing

**Later:** We can add real authentication when you're ready

---

## TROUBLESHOOTING

### "Cannot connect to server"
- Make sure both backend and frontend are running
- Check that ports 3000 and 5173 are not in use
- Restart using QUICK_START.bat

### "Page not loading"
- Clear browser cache
- Try incognito/private mode
- Check console for errors (F12)

### "Features not working"
- Check both terminal windows are still running
- Look for error messages in terminals
- Restart the application

---

## NEXT STEPS: ADD AI (After Testing)

Once you've tested with real jobs and confirmed everything works:

### Free AI Features We'll Add:
1. **AI Diagnostic Assistant**
   - Type symptoms → Get diagnosis suggestions
   - Historical pattern matching
   - Parts recommendations

2. **Smart Pricing**
   - AI suggests optimal pricing
   - Based on your historical data
   - Profit margin optimization

3. **Voice-to-Text**
   - Speak job notes
   - Hands-free data entry
   - Using free Whisper API

4. **Invoice OCR**
   - Photo of supplier invoice
   - Auto-extract parts and costs
   - Using free Tesseract OCR

5. **Conversational BI**
   - Ask questions in plain English
   - "Show me my best customers"
   - "Which jobs went over budget?"

**All using FREE open-source AI - zero monthly costs!**

---

## SUPPORT

If you encounter any issues:
1. Check the terminal windows for error messages
2. Review this guide
3. Check START_APP.md for detailed instructions

---

## 🎉 YOU'RE READY TO GO!

**Just double-click `QUICK_START.bat` and start managing your workshop!**

Test it with your real jobs today, then we'll add AI superpowers tomorrow.
