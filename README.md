# Cocoa & Co. — Drink POS

Static, mobile-friendly Thai beverage POS. 15 supplied drinks with exact prices; sweetness 0/30/70/100%. No dependencies at runtime, no server and no embedded credentials.

## Features
- Menu search and categories; quantity and separate sweetness variants.
- Cash / manually verified bank transfer; cash received and change.
- Receipt printing, daily sales, persisted sales journal and UTF-8 CSV export.
- Responsive desktop / tablet / phone layouts.

## Important
Sales are first stored in this browser's localStorage. Optional Google Sheets upload is enabled by entering SHOP_KEY in Settings on each selling device; no secret is embedded in this repository. The key is kept in localStorage: people with access to that browser can retrieve it. New sales queue durably in the same local sale record, and a readable matching Apps Script acknowledgement is required before marking them synced. Network failures remain pending; retry uses the original ID. Old local-only sales upload only after explicit confirmation (including any test orders). This is one-way upload, NOT cross-device history synchronization. Health check and unauthorized CORS POST were verified; a real successful Sheets write needs the owner's key and sheet read-back. Use one checkout tab at a time. Clearing local site data removes unsent sales and the device key. Export CSV regularly. Private browsing storage is temporary. Transfer mode does not verify bank payment. No tax invoice, stock management or staff authentication. Brand is a placeholder.

## Development
Node 22+. Run `npm ci && npm test`. Serve this folder with `python -m http.server 8765`. For browser verification: `npx playwright install chromium && npm run test:e2e`. Set POS_URL to test a deployed URL. Browser tests use an isolated temporary browser profile, never real sales.

## Deployment
GitHub Pages Actions publishes only index.html, style.css, app.js and core.js after tests pass on main.
