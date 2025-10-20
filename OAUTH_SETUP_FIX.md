# 🔧 Google OAuth Setup Fix

## The Problem
The error "Access blocked: redirect_uri_mismatch" means the redirect URI in your Google OAuth credentials doesn't match what the app is expecting.

## ✅ Quick Fix Steps

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services → Credentials**
4. Click your OAuth 2.0 Client ID (or create one if you don't have it)

### Step 2: Configure Redirect URIs
In the OAuth client configuration, add these **exact** redirect URIs:

```
http://localhost:3001/api/google/callback
```

**Important:** Make sure there are no extra spaces or characters!

### Step 3: Configure Authorized Origins
Add this to authorized JavaScript origins:

```
http://localhost:3001
http://localhost:5173
```

### Step 4: Enable Required APIs
Make sure these APIs are enabled in your Google Cloud project:
- **Google My Business API** (if available)
- **Google Places API**
- **Business Profile Performance API**

### Step 5: Get Your Credentials
1. Copy your **Client ID**
2. Copy your **Client Secret**
3. Enter them in the ReviewResponder app

## 🚀 Test the Setup

1. **Start the backend**: Make sure `npm start` is running in the `backend` folder
2. **Start the frontend**: Make sure `npm run dev` is running in the main folder
3. **Open the app**: Go to http://localhost:5173
4. **Configure credentials**: Enter your Client ID and Client Secret
5. **Test OAuth**: Click the Google authorization link

## 📝 Current OAuth Flow

```
User clicks "Authorize" 
    ↓
Redirects to Google OAuth
    ↓
User grants permission
    ↓
Google redirects to: http://localhost:3001/api/google/callback?code=...
    ↓
Backend exchanges code for access token
    ↓
Redirects back to frontend: http://localhost:5173/?auth=success
    ↓
Frontend detects success and refreshes credentials
```

## 🐛 Common Issues

### Issue: "redirect_uri_mismatch"
- **Solution**: Make sure the redirect URI in Google Console is exactly: `http://localhost:3001/api/google/callback`

### Issue: "invalid_client"
- **Solution**: Double-check your Client ID and Client Secret

### Issue: "access_denied"
- **Solution**: Make sure you're using the correct Google account and granting permissions

## 🔍 Debug Mode

To see what's happening, check the browser console (F12) and the backend terminal for error messages.

The backend should show:
```
✅ Google My Business service initialized
📝 Received OAuth callback with code: ...
✅ Google OAuth completed successfully
```

## 📞 Still Having Issues?

1. **Check the exact redirect URI** in Google Console - it must match exactly
2. **Make sure both servers are running** (backend on 3001, frontend on 5173)
3. **Try a fresh browser session** (clear cookies/cache)
4. **Check that APIs are enabled** in Google Cloud Console

---

Once this is working, you'll be able to connect your Google My Business account and start using the automated review response system! 🎉
