# Cocoa & Co. — Drink POS

Static, mobile-friendly Thai beverage POS. 15 supplied drinks with exact prices; sweetness 0/30/70/100%. No dependencies at runtime, no server and no embedded credentials.

## Features
- Menu search and categories; quantity and separate sweetness variants.
- Cash / manually verified bank transfer; cash received and change.
- Receipt printing, daily sales, persisted sales journal and UTF-8 CSV export.
- Responsive desktop / tablet / phone layouts.

## Important
Sales are stored only in this browser's localStorage. Clearing site data deletes them. Different devices/browsers do NOT share records. Export CSV regularly. Private browsing storage is temporary. Transfer mode does not verify the bank payment and does not create a payment QR code. No tax invoice, stock management, staff authentication or cloud backup. Use one checkout tab at a time to avoid simultaneous localStorage writes. Brand is a placeholder.

## Development
Node 22+. Run `npm ci && npm test`. Serve this folder with `python -m http.server 8765`. For browser verification: `npx playwright install chromium && npm run test:e2e`. Set POS_URL to test a deployed URL. Browser tests use an isolated temporary browser profile, never real sales.

## Deployment
GitHub Pages Actions publishes only index.html, style.css, app.js and core.js after tests pass on main.
