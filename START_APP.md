# Quick Start Guide - Gearbox Workshop Management

## Start the Application NOW

### Step 1: Start Backend Server (Terminal 1)
```bash
cd "c:\projects\Gearbox Fintech\rebuilt"
npm run server
```
Server will run on: http://localhost:3000

### Step 2: Start Frontend (Terminal 2)
```bash
cd "c:\projects\Gearbox Fintech\rebuilt"
npm run dev
```
Frontend will run on: http://localhost:5173

### Step 3: Access the App
Open browser: **http://localhost:5173**

---

## For Remote Access (Access from phone/other devices)

### Option A: Use ngrok (Fastest - 2 minutes)
```bash
# Install ngrok: https://ngrok.com/download
# Then run:
ngrok http 5173
```
You'll get a public URL like: `https://abc123.ngrok.io`

### Option B: Use your local network IP
1. Find your computer's IP: `ipconfig` (look for IPv4)
2. Access from same network: `http://YOUR_IP:5173`
3. Make sure Windows Firewall allows port 5173

---

## Current Features Ready to Use

✅ **Job Management** - Create, track, update jobs
✅ **Customer Management** - Full customer profiles
✅ **Vehicle Tracking** - Vehicle history and details
✅ **Digital Vehicle Inspection (DVI)** - Photo-based inspections
✅ **Cost Tracking** - Labor, parts, overhead allocation
✅ **Invoicing** - Generate professional invoices
✅ **Booking Calendar** - Schedule appointments
✅ **Dashboard** - Real-time business metrics
✅ **Mobile Interface** - Technician mobile view
✅ **Dark/Neon Theme** - Modern UI throughout

---

## Test with Real Jobs Today

### Create Your First Job:
1. Go to Dashboard
2. Click "New Job"
3. Fill in customer details
4. Add vehicle info
5. Enter job description
6. Add costs (labor/parts)
7. Track progress

### All data saves to local SQLite database
Database location: `c:\projects\Gearbox Fintech\rebuilt\local.db`

---

## No Setup Required
- Mock authentication (auto-logged in as owner)
- Demo data available
- All features work offline
- No external API keys needed for core features

---

## Next: Add AI Features (After Testing)
Once you've tested with real jobs, we'll add:
- AI diagnostic suggestions
- Smart pricing recommendations
- Voice-to-text job notes
- Automated invoice OCR
All using FREE AI services (no monthly costs)
