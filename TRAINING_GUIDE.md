# Gearbox Fintech - User Training Guide
**Version:** 1.0  
**Last Updated:** 2026-01-06

---

## 📚 TABLE OF CONTENTS

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Customer Management](#customer-management)
4. [Job Management](#job-management)
5. [Digital Vehicle Inspection (DVI)](#digital-vehicle-inspection)
6. [Inventory Management](#inventory-management)
7. [Invoicing & Payments](#invoicing--payments)
8. [Booking Widget](#booking-widget)
9. [Mobile App for Technicians](#mobile-app)
10. [Reports & Analytics](#reports--analytics)
11. [Integrations](#integrations)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 GETTING STARTED

### First-Time Setup

1. **Access Your Account**
   - Navigate to `https://yourdomain.com`
   - Enter your email address
   - Click "Send Magic Link"
   - Check your email and click the login link

2. **Complete Your Profile**
   - Click your avatar (top right)
   - Select "Settings"
   - Fill in:
     - Workshop name
     - Contact details
     - Business address
     - GST number (if registered)
     - Bank details

3. **Set Up Your Workshop**
   - Go to "Settings" → "Workshop Configuration"
   - Configure:
     - Number of bays
     - Operating hours
     - Service types
     - Pricing

---

## 📊 DASHBOARD OVERVIEW

### Main Dashboard

The dashboard shows your workshop at a glance:

**Top Metrics:**
- **Today's Revenue:** Real-time revenue tracking
- **Active Jobs:** Current jobs in progress
- **New Work Auth:** DVI approvals pending
- **Growth:** Performance vs last period

**Live Workload:**
- Visual cards for each active job
- Current status and progress
- Assigned technician
- Quick actions (Report, Invoice)

**Insights Panel:**
- Workshop velocity (efficiency score)
- DVI upsell performance
- Recent activity feed
- AI-powered recommendations

### Navigation

**Top Menu:**
- Dashboard
- Jobs
- Customers
- Inventory
- Reports
- Settings

**Quick Actions:**
- New Job (+ button)
- Scan QR
- Search (⌘K)

---

## 👥 CUSTOMER MANAGEMENT

### Adding a New Customer

1. Click "Customers" in main menu
2. Click "+ New Customer"
3. Fill in details:
   - Name (required)
   - Email
   - Phone/Mobile
   - Address
   - Notes
4. Click "Save"

### Adding a Vehicle

1. Open customer profile
2. Click "Add Vehicle"
3. Enter:
   - License plate (required)
   - VIN
   - Make/Model/Year
   - WoF expiry
   - Rego expiry
4. Click "Save"

### Customer Portal Access

Customers can access their own portal:
1. They receive a magic link via SMS/Email
2. Can view:
   - Vehicle fleet
   - Service history
   - Invoices
   - DVI reports
3. Can pay invoices online
4. Can approve DVI recommendations

---

## 💼 JOB MANAGEMENT

### Creating a New Job

1. Click "+ New Job"
2. Select customer (or create new)
3. Select vehicle
4. Enter:
   - Job description
   - Quoted price
   - Service type
5. Assign to technician
6. Click "Create Job"

### Job Workflow

```
Quoted → In Progress → Completed → Invoiced → Paid
```

**At Each Stage:**

**Quoted:**
- Send quote to customer
- Wait for approval
- Convert to job when approved

**In Progress:**
- Technician performs work
- Add parts used
- Capture DVI photos
- Update progress

**Completed:**
- Mark job complete
- Generate invoice
- Send to customer

**Invoiced:**
- Track payment status
- Send reminders
- Sync to Xero

**Paid:**
- Record payment
- Archive job
- Update customer history

### Adding Parts to a Job

1. Open job
2. Click "Add Parts"
3. Search for part
4. Enter quantity
5. Stock automatically deducted
6. Cost and sell price tracked

### Adding Labor

1. Open job
2. Click "Add Labor"
3. Enter:
   - Description
   - Hours
   - Rate
4. Total calculated automatically

---

## 📸 DIGITAL VEHICLE INSPECTION (DVI)

### Performing a DVI (Technician)

1. **Start Inspection**
   - Open job
   - Click "Start DVI"
   - Select template (or create custom)

2. **Capture Findings**
   For each item:
   - Select status (Green/Amber/Red)
   - Add description
   - Take photos/videos
   - Estimate cost
   - Recommend action

3. **Complete Inspection**
   - Review all items
   - Add overall notes
   - Click "Complete"
   - Share with customer

### Customer Approval

1. **Customer Receives Link**
   - Via SMS and Email
   - Opens in browser (no login needed)

2. **Customer Reviews**
   - Sees all findings
   - Views photos/videos
   - Reads recommendations
   - Sees estimated costs

3. **Customer Approves**
   - Selects items to approve
   - Clicks "Approve Selected"
   - Receives confirmation

4. **Workshop Notified**
   - Approval notification sent
   - Job updated automatically
   - Work can proceed

### DVI Best Practices

✅ **DO:**
- Take clear, well-lit photos
- Show the issue clearly
- Include context (location on vehicle)
- Be specific in descriptions
- Provide accurate cost estimates

❌ **DON'T:**
- Use blurry photos
- Skip important items
- Over-estimate costs
- Use technical jargon
- Rush the inspection

---

## 📦 INVENTORY MANAGEMENT

### Parts Catalog

**Adding a New Part:**
1. Go to "Inventory" → "Parts"
2. Click "+ New Part"
3. Enter:
   - Part number
   - Name/Description
   - Category
   - Supplier
   - Cost price
   - Sell price
   - Min/Max stock levels
   - Location (shelf/bin)
4. Click "Save"

**Stock Levels:**
- Green: Above minimum
- Amber: At minimum
- Red: Below minimum (reorder!)

### Stock Movements

**Automatic:**
- Parts used in jobs (deducted)
- Purchase orders received (added)
- Returns from jobs (added back)

**Manual Adjustments:**
1. Go to "Inventory" → "Movements"
2. Click "+ Adjustment"
3. Select part
4. Enter quantity (+/-)
5. Add reason
6. Click "Save"

### Purchase Orders

**Creating a PO:**
1. Go to "Inventory" → "Purchase Orders"
2. Click "+ New PO"
3. Select supplier
4. Add parts and quantities
5. Review totals
6. Click "Send to Supplier"

**Receiving Goods:**
1. Open purchase order
2. Click "Receive Goods"
3. Enter quantities received
4. Stock automatically updated
5. PO marked as received

### Low Stock Alerts

**Automatic Alerts:**
- Email when part below minimum
- Dashboard notification
- Suggested reorder quantity
- Preferred supplier shown

**Reordering:**
1. Click "View Low Stock"
2. Select parts to reorder
3. Click "Create PO"
4. Review and send

---

## 💰 INVOICING & PAYMENTS

### Generating an Invoice

**Automatic:**
- Mark job as "Completed"
- Invoice generated automatically
- Includes all parts and labor
- GST calculated

**Manual:**
1. Go to "Jobs" → Select job
2. Click "Create Invoice"
3. Review line items
4. Adjust if needed
5. Click "Generate"

### Sending to Customer

1. Open invoice
2. Click "Send"
3. Choose method:
   - Email
   - SMS with link
   - Print
4. Customer receives invoice

### Payment Methods

**Online (Stripe):**
- Customer clicks "Pay Now"
- Enters card details
- Payment processed
- Invoice marked paid

**Manual:**
- Cash
- EFTPOS
- Bank transfer
- Record in system

### Xero Integration

**Automatic Sync:**
- Invoices pushed to Xero
- Payments reconciled
- Contacts synced
- Real-time updates

**Manual Sync:**
1. Open invoice
2. Click "Sync to Xero"
3. Verify in Xero
4. Done!

---

## 📅 BOOKING WIDGET

### Installing on Your Website

1. Go to "Settings" → "Booking Widget"
2. Copy the embed code:
```html
<script src="https://yourdomain.com/widget.js"></script>
<div id="gearbox-booking"></div>
```
3. Paste into your website
4. Customize colors/branding
5. Test booking flow

### Customer Booking Flow

1. **Select Service**
   - Customer chooses service type
   - Sees estimated duration and price

2. **Choose Date/Time**
   - Real-time availability shown
   - Based on bay capacity
   - Buffer times included

3. **Enter Details**
   - Name, email, phone
   - Vehicle information
   - Special requests

4. **Confirmation**
   - Booking confirmed
   - SMS and email sent
   - Added to your calendar

### Managing Bookings

**View Bookings:**
- Go to "Bookings"
- See all upcoming bookings
- Filter by status/date

**Confirm/Cancel:**
- Click booking
- Select action
- Customer notified automatically

---

## 📱 MOBILE APP (TECHNICIANS)

### Installation

**iOS:**
1. Open Safari
2. Go to `https://yourdomain.com/mobile`
3. Tap Share → "Add to Home Screen"
4. App icon appears on home screen

**Android:**
1. Open Chrome
2. Go to `https://yourdomain.com/mobile`
3. Tap menu → "Add to Home Screen"
4. App icon appears

### Features

**QR Scanning:**
1. Tap "Scan QR"
2. Point camera at vehicle QR code
3. Job opens automatically
4. Start work immediately

**Camera Capture:**
1. Open job
2. Tap camera icon
3. Take multiple photos
4. Photos upload automatically
5. Attached to job/DVI

**Offline Mode:**
- View job list offline
- Capture photos offline
- Syncs when back online
- No data loss

**Time Tracking:**
1. Open job
2. Tap "Start Timer"
3. Work on job
4. Tap "Stop Timer"
5. Time logged automatically

---

## 📊 REPORTS & ANALYTICS

### Financial Reports

**Revenue Trends:**
- Daily/weekly/monthly revenue
- Compare periods
- Identify trends
- Export to Excel

**Profit Margins:**
- By job type
- By service
- By customer
- Overall margin

**Outstanding Invoices:**
- Aging report
- 0-30, 31-60, 61-90, 90+ days
- Total outstanding
- Collection rate

### Operational Reports

**Bay Utilization:**
- Percentage used
- Hours productive
- Jobs per bay
- Optimize scheduling

**Technician Performance:**
- Jobs completed
- Average time
- Revenue generated
- Efficiency score
- Customer ratings

### Customer Reports

**Lifetime Value:**
- Average customer value
- Repeat rate
- Churn risk
- Top customers

**Service Frequency:**
- Visit patterns
- Popular services
- Seasonal trends

### Exporting Reports

1. Select report
2. Choose date range
3. Click "Export"
4. Choose format:
   - PDF
   - Excel
   - CSV
5. Download or email

---

## 🔗 INTEGRATIONS

### Xero Accounting

**Setup:**
1. Go to "Settings" → "Integrations"
2. Click "Connect Xero"
3. Login to Xero
4. Authorize Gearbox
5. Select organization
6. Done!

**What Syncs:**
- Invoices (push)
- Payments (pull)
- Contacts (both ways)
- Real-time updates

### Stripe Payments

**Setup:**
1. Go to "Settings" → "Payments"
2. Click "Connect Stripe"
3. Login to Stripe
4. Authorize Gearbox
5. Test payment
6. Go live!

**Features:**
- Card payments
- Apple Pay / Google Pay
- Automatic receipts
- Refunds
- Dispute management

### SMS (Twilio)

**Setup:**
1. Sign up at twilio.com
2. Get phone number
3. Copy credentials
4. Add to Gearbox settings
5. Test SMS

**Use Cases:**
- Booking confirmations
- DVI ready notifications
- Payment reminders
- Service reminders

### Email (SendGrid)

**Setup:**
1. Sign up at sendgrid.com
2. Verify sender identity
3. Copy API key
4. Add to Gearbox settings
5. Test email

**Templates:**
- Booking confirmation
- Invoice ready
- DVI approval
- Service reminders

---

## 🔧 TROUBLESHOOTING

### Common Issues

**Can't Login:**
- Check email spam folder
- Magic link expires in 15 minutes
- Request new link
- Contact support if persists

**Invoice Not Syncing to Xero:**
- Check Xero connection status
- Verify organization selected
- Check error logs
- Re-authorize if needed

**Parts Not Deducting:**
- Verify part exists in catalog
- Check stock quantity
- Ensure job is saved
- Check stock movements log

**Photos Not Uploading:**
- Check internet connection
- Verify file size (<10MB)
- Try different format (JPEG)
- Clear browser cache

**Booking Widget Not Showing:**
- Verify embed code correct
- Check JavaScript enabled
- Test in different browser
- Check console for errors

### Getting Help

**In-App Support:**
- Click "?" icon
- Search help articles
- Submit support ticket

**Email Support:**
- support@gearbox.app
- Response within 24 hours

**Phone Support:**
- +64 9 XXX XXXX
- Mon-Fri 8am-6pm NZST

**Video Tutorials:**
- youtube.com/gearboxfintech
- Step-by-step guides
- New features

---

## 🎓 TRAINING CHECKLIST

### Week 1: Basics
- [ ] Login and navigation
- [ ] Add customers
- [ ] Add vehicles
- [ ] Create jobs
- [ ] Generate invoices

### Week 2: Advanced
- [ ] Perform DVI
- [ ] Manage inventory
- [ ] Create purchase orders
- [ ] Use mobile app
- [ ] View reports

### Week 3: Optimization
- [ ] Set up integrations
- [ ] Configure booking widget
- [ ] Customize workflows
- [ ] Train team
- [ ] Go live!

---

## 📞 SUPPORT & RESOURCES

**Documentation:**
- docs.gearbox.app

**Video Tutorials:**
- youtube.com/gearboxfintech

**Community Forum:**
- community.gearbox.app

**Feature Requests:**
- feedback.gearbox.app

**Status Page:**
- status.gearbox.app

---

**🎉 Congratulations! You're now ready to use Gearbox Fintech!**

*For personalized training, contact our team to schedule a live session.*
