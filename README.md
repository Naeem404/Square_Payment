# MSA Payment Kiosk

A self-service payment kiosk for the MSA, powered by Square. Deploy once to Netlify — no server to run, no laptop to keep open. Just open the URL on any phone or tablet placed next to a Square Reader.

## How It Works

1. **Kiosk screen** shows two big buttons: **$5** and **$10**
2. Person taps a button → card payment form appears
3. They enter/tap their card → payment is processed via Square
4. Success screen shows → auto-resets after 8 seconds for the next person
5. **Admin dashboard** at `/admin` (PIN-protected) shows all collected payments

No handler needed. No setup between transactions. Tap amount → pay → done.

---

## Quick Start (Deploy to Netlify)

### 1. Get Square API Credentials

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application (or use an existing one)
3. Note down:
   - **Application ID**
   - **Access Token** (from the "Credentials" tab)
   - **Location ID** (from the "Locations" tab, or use the API to list locations)

> **Tip:** Use **Sandbox** credentials first to test, then switch to **Production** when ready for real payments.

### 2. Deploy to Netlify

#### Option A: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Connect your GitHub repo (push this code first)
2. Netlify auto-detects Next.js settings
3. Add environment variables (see below)
4. Deploy!

#### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 3. Set Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `SQUARE_ACCESS_TOKEN` | Your Square access token |
| `SQUARE_APPLICATION_ID` | Your Square application ID |
| `SQUARE_LOCATION_ID` | Your Square location ID |
| `SQUARE_ENVIRONMENT` | `sandbox` or `production` |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | Same as SQUARE_APPLICATION_ID |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Same as SQUARE_LOCATION_ID |
| `NEXT_PUBLIC_SQUARE_ENVIRONMENT` | Same as SQUARE_ENVIRONMENT |
| `ADMIN_PIN` | Any PIN for admin dashboard (e.g. `4321`) |

### 4. Use It

- Open your Netlify URL on a phone/tablet
- Place the device next to your Square Reader
- People tap $5 or $10, enter card details, and they're done

---

## Local Development (Optional)

Only if you want to make changes:

```bash
# Install dependencies
npm install

# Copy env file and fill in your credentials
cp .env.local.example .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main kiosk screen ($5 / $10 buttons)
│   ├── layout.tsx            # App layout (dark theme, mobile-optimized)
│   ├── globals.css           # Global styles + animations
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard (PIN-protected)
│   └── api/
│       ├── create-payment/
│       │   └── route.ts      # Square Payments API integration
│       └── list-payments/
│           └── route.ts      # List payments for admin dashboard
├── components/
│   └── PaymentFlow.tsx       # Card payment form (Square Web Payments SDK)
└── lib/
    └── square.ts             # Square client configuration
```

---

## Admin Dashboard

Access at `yoursite.netlify.app/admin`

- Enter the PIN you set in env vars
- See total collected, completed payments count, all transactions
- Card brand + last 4 digits for each payment
- Auto-refreshable

---

## Switching to Production

1. In Square Developer Dashboard, go to your app → **Production** tab
2. Copy Production Access Token and Application ID
3. Update Netlify env vars:
   - `SQUARE_ENVIRONMENT` → `production`
   - `NEXT_PUBLIC_SQUARE_ENVIRONMENT` → `production`
   - Update tokens to production values
4. Redeploy (Netlify auto-redeploys on env var changes if you trigger a build)

---

## Supported Payment Methods

- **Card entry** (number, expiry, CVV)
- **Apple Pay** (on Safari/iOS devices)
- **Google Pay** (on Chrome/Android devices)
- **Tap-to-pay** via digital wallets

---

## FAQ

**Q: Do I need the Square Reader hardware for this?**
A: No! This app uses Square's Web Payments SDK which accepts card details directly through the browser. The Square Readers are a bonus for in-person NFC/chip payments via the native Square app. This web kiosk handles everything digitally.

**Q: Can I change the preset amounts?**
A: Yes — edit `src/app/page.tsx` and update the amounts. Also update the validation in `src/app/api/create-payment/route.ts`.

**Q: Is it secure?**
A: Yes. Card data never touches your server. Square's SDK tokenizes card info client-side and sends a secure token to Square's servers. Your Netlify functions only receive tokens.

**Q: Can multiple kiosks run simultaneously?**
A: Yes! Deploy once, open on as many devices as you want. Each processes payments independently.
