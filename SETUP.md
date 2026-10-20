# SmartBuy Hub — setup checklist

## 1. Create the Google Sheet
Create a Google Sheet called **SmartBuy Hub Store Data**. Copy its ID from the URL (the part between `/d/` and `/edit`). Keep the sheet private. The backend creates `Products` and `Orders` tabs and headers automatically.

### Products tab
The first row is:
`Product ID | Product Name | Category | Price | Image URL | Description | Stock | Status`

You can add products through the admin form, or manually add rows. Use unique product IDs for manual rows. Status should be `Active` or `Inactive`. Image URLs must be public HTTPS image links. Product images must be yours or used with permission.

### Orders tab
The backend creates an order log with customer email, delivery details, products, total, payment method/status, and payment identifiers. Limit access to this sheet to trusted store operators only.

## 2. Create Google service account access
1. In Google Cloud Console, create/select a project.
2. Enable **Google Sheets API**.
3. Create a service account and a JSON key.
4. Open the downloaded JSON file privately. Copy its `client_email` and `private_key`.
5. Share your Google Sheet with the service-account email as **Editor**.
6. Never put the JSON key in HTML, `config.js`, a public repo, or this ZIP.

## 3. Set Netlify environment variables
In Netlify, open your site → **Site configuration / Environment variables** (label may vary) and add these variables. Set them for Functions/runtime and redeploy after changes.

- `GOOGLE_SHEET_ID` = your spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = service account `client_email`
- `GOOGLE_PRIVATE_KEY` = service account `private_key` (paste full key; preserve newlines or use `\n`)
- `SUPABASE_URL` = Supabase project URL
- `SUPABASE_ANON_KEY` = Supabase publishable/anon key
- `ADMIN_EMAILS` = your admin login email (comma-separated list if multiple)
- `RAZORPAY_KEY_ID` = Razorpay test key ID initially
- `RAZORPAY_KEY_SECRET` = Razorpay test secret

Keep private keys and payment secrets in Netlify environment variables only. Do not add them to `config.js`.

## 4. Configure Supabase login
1. Create a project at Supabase.
2. In Authentication → Providers, enable Email.
3. Configure email confirmation and password rules as you prefer.
4. In Project Settings → API, copy the Project URL and the publishable/anon key.
5. Put those two public values in `config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Add the same URL/key as Netlify environment variables from step 3.
7. Add your email to `ADMIN_EMAILS` in Netlify. Sign up using that exact email, confirm it if email confirmation is enabled, and log in.
8. Once logged in, click your account button and use right-click/context-menu to open the admin panel on desktop. For mobile, the account button's context menu may be inconvenient; use the Admin button feature added below in the final deployment instructions or change the admin entry point in `app.js` to show an Admin option after `isAdmin()` returns true.

Supabase Auth is used for user identity; the backend validates the bearer token. The Google Sheet itself is not public.

## 5. Deploy to Netlify
1. Extract this ZIP to a folder.
2. Install Node.js LTS and run `npm install`.
3. For local testing run `npx netlify dev`.
4. Deploy the folder using Netlify Drop or connect a Git repository. For the most reliable workflow, push the project to a private Git repository and connect it to Netlify.
5. Add all environment variables in Netlify and redeploy.
6. Visit `/.netlify/functions/products` on the deployed site. It should return products from Google Sheets and `"demo": false`. If it returns `"demo": true`, check Netlify Function logs and environment variables.
7. Place a COD test order and verify the row appears in `Orders`.

## 6. Razorpay payments
- Begin with Razorpay **test mode** keys.
- Confirm the create-payment function creates a Razorpay order and that the checkout opens.
- Confirm a successful captured test payment updates `Payment Status` to `Paid`.
- Never set an order to Paid just because the browser says payment succeeded; the backend verifies signature, payment status and amount.
- Before live use, complete the payment provider's required account/merchant verification and test failed/cancelled payments, duplicate submissions, refunds and webhook handling. Consider adding a Razorpay webhook and idempotency protection before production.

## 7. How to add products
1. Sign in with the email listed in `ADMIN_EMAILS`.
2. Open the admin form from the account menu (the starter uses a context-menu/right-click shortcut on the account button).
3. Fill in name, category, price, HTTPS image URL, description, stock and status.
4. Click **Save product to Google Sheets**. Refresh the catalogue to see it.

## 8. Troubleshooting
- **Demo catalogue appears:** Google Sheets env vars are missing/incorrect, sheet not shared with service account, or the function failed. Check Netlify Function logs.
- **Login not configured:** fill in `config.js` and the matching Netlify Supabase environment variables.
- **Admin access denied:** check exact email spelling in `ADMIN_EMAILS`, then sign out and back in.
- **Online payment not configured:** add Razorpay test key ID/secret as Netlify environment variables and redeploy.
- **Function returns 500:** inspect Netlify function logs. Do not expose private keys when asking for help.
- **Changes to environment variables:** redeploy; Netlify functions use the values present at deploy time.

## Official documentation
- Netlify Functions and environment variables: https://docs.netlify.com/build/functions/environment-variables/
- Google Sheets API quickstart: https://developers.google.com/workspace/sheets/api/quickstart/nodejs
- Razorpay Standard Checkout: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
- Supabase Auth: https://supabase.com/docs/guides/auth
