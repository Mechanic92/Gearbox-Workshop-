# Gearbox Booking Widget - Integration Guide

## 🔑 No API Key Required!

The Gearbox public booking API is **open and doesn't require authentication**. You only need your **Shop ID**.

---

## 📋 What You Need

### 1. **Shop ID (Ledger ID)**

This is your unique workshop identifier.

**How to find it:**
1. Log into Gearbox dashboard: `https://gearbox-workshop-production.up.railway.app`
2. Go to **Settings** → **Organization**
3. Your **Ledger ID** is displayed at the top
4. It's usually a number like `1`, `2`, `3`, etc.

**Or check the database:**
```bash
# If you have database access
SELECT id, name FROM ledgers;
```

---

## 🔌 API Endpoints (No Auth Required)

### **Base URL:**
```
https://gearbox-workshop-production.up.railway.app/api/trpc
```

### **Available Public Endpoints:**

#### 1. **Get Shop Information**
```javascript
POST /api/trpc/public.getShopInfo
{
  "shopId": "1"
}
```

#### 2. **Check Availability**
```javascript
POST /api/trpc/public.availability
{
  "shopId": "1",
  "date": "2026-01-30",
  "serviceType": "WOF Inspection",
  "serviceDuration": 45
}
```

#### 3. **Create Booking**
```javascript
POST /api/trpc/public.createBooking
{
  "shopId": "1",
  "customerName": "John Smith",
  "customerPhone": "0211234567",
  "customerEmail": "john@example.com",
  "vehicleRegistration": "ABC123",
  "vehicleMake": "Toyota",
  "vehicleModel": "Corolla",
  "serviceType": "WOF Inspection",
  "preferredDate": "2026-01-30",
  "preferredTime": "09:00",
  "notes": "Optional notes",
  "captchaToken": "hcaptcha_token_here"
}
```

---

## ⚙️ Widget Configuration

### **Minimal Setup (3 values):**

```javascript
const CONFIG = {
    API_URL: 'https://gearbox-workshop-production.up.railway.app/api/trpc',
    SHOP_ID: '1',  // ← CHANGE THIS TO YOUR LEDGER ID
    HCAPTCHA_SITEKEY: '10000000-ffff-ffff-ffff-000000000001'  // ← Get free from hcaptcha.com
};
```

That's it! No API keys, no authentication tokens.

---

## 🎯 Quick Start

### **Step 1: Get Your Shop ID**
- Log into Gearbox
- Settings → Organization
- Copy your Ledger ID

### **Step 2: Get hCaptcha Site Key (Free)**
1. Go to [hcaptcha.com](https://www.hcaptcha.com/)
2. Sign up (free)
3. Create a new site
4. Copy your **Site Key**

### **Step 3: Update Widget**
Open `booking-widget-enhanced.html` and update line 285:

```javascript
const CONFIG = {
    API_URL: 'https://gearbox-workshop-production.up.railway.app/api/trpc',
    SHOP_ID: '1',  // ← YOUR LEDGER ID HERE
    HCAPTCHA_SITEKEY: 'your_site_key_here'  // ← YOUR HCAPTCHA KEY HERE
};
```

### **Step 4: Upload to Your Website**
- Upload the HTML file to your website
- Link to it from your booking page
- Done!

---

## 🧪 Testing

### **Test the API directly:**

```bash
# Check availability
curl -X POST https://gearbox-workshop-production.up.railway.app/api/trpc/public.availability \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "1",
    "date": "2026-01-30",
    "serviceType": "WOF Inspection",
    "serviceDuration": 45
  }'
```

### **Test booking creation:**

```bash
curl -X POST https://gearbox-workshop-production.up.railway.app/api/trpc/public.createBooking \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "1",
    "customerName": "Test Customer",
    "customerPhone": "0211234567",
    "customerEmail": "test@example.com",
    "serviceType": "WOF Inspection",
    "preferredDate": "2026-01-30",
    "preferredTime": "09:00",
    "captchaToken": "mock-token"
  }'
```

---

## 📊 Service Configuration

Update your services in the widget (around line 240):

```html
<select id="serviceType" required>
    <option value="">Select a service...</option>
    <option value="WOF Inspection" data-duration="45" data-price="65">
        WOF Inspection - $65
    </option>
    <option value="Oil Change" data-duration="60" data-price="120">
        Oil Change & Service - $120
    </option>
    <!-- Add your services here -->
</select>
```

**Important:** The `value` must match services in your Gearbox database.

---

## 🔒 Security Notes

- **No API key needed** - Public endpoints are intentionally open
- **CAPTCHA required** - Prevents spam bookings
- **Rate limiting** - Built into the API
- **Data validation** - All inputs are validated server-side

---

## 📞 Support

If you need help:
1. Check the browser console for errors
2. Verify your Shop ID is correct
3. Ensure services match your Gearbox setup
4. Test API endpoints directly with curl

---

## 🎉 That's It!

You only need:
1. ✅ Shop ID (from Gearbox dashboard)
2. ✅ hCaptcha Site Key (free from hcaptcha.com)
3. ✅ Upload widget to your website

No API keys, no complex authentication, no backend required!
