# เกิดอยากจะโก้ — Drink POS

## Order numbers
Customer-facing tickets use a persistent per-browser sequence `0000` through `9999`, wrapping and skipping numbers still in the unpaid queue. Cancelling an order does not rewind the sequence; a failed storage write may skip a number. Existing unpaid orders receive numbers on load without changing their UUIDs, totals or items. Already-paid legacy receipts keep their original labels. New receipts/history and CSV include the four-digit number; CSV also retains the immutable UUID. Internal UUIDs and the existing Sheets Order ID column remain unchanged for backend validation and idempotency. Number counters/queues are local to each browser, not globally coordinated across devices.

## Order queue
Build a cart -> Summary -> confirm into unpaid queue -> immediately take the next order. Open Waiting for payment and select an order when the customer is ready. Only successful payment adds revenue, receipt history and Sheets upload. Optional customer/note text and immutable order ID identify each order. Cash and manually checked transfer are supported.

Unpaid orders persist in localStorage `cocoa-pos-unpaid-v1` on this browser only; paid sales keep the existing `cocoa-pos-v1` key and drafts remain in sessionStorage. Unpaid orders do not upload to Sheets and do not count as sales. Refresh retains unpaid orders; clearing site data removes them. A payment commits its receipt before removing the queued order. Stale already-paid IDs are hidden to prevent a repeated payment after a partial storage failure. Cancelling an unpaid order requires confirmation and does not change revenue. Closing payment preserves both the queued order and any new cart draft. Use one checkout tab/device for a shared queue; queues do not sync across devices.

Queue regressions: `node tests/queue-browser.mjs && node tests/queue-safety.mjs`; WebKit: `WEBKIT=1 node tests/queue-browser.mjs`. All browser tests use isolated fixture storage, and fixture keys have Google requests intercepted.

Static, mobile-friendly Thai beverage POS. 15 supplied drinks with exact prices; sweetness 0/30/70/100%. No dependencies at runtime, no server and no embedded credentials.

## Features
- Menu search and categories; quantity and separate sweetness variants.
- Cash / manually verified bank transfer; cash received and change.
- Receipt printing, daily sales, persisted sales journal and UTF-8 CSV export.
- Delete individual bills from expanded history with confirmation. Deletion updates local daily totals, CSV and pending uploads; it cannot be undone and does not delete rows already uploaded to Google Sheets. Export a backup first. Deletion is disabled while this tab is uploading; keep one checkout tab open.
- Responsive desktop / tablet / phone layouts.

## Important
Sales are first stored in this browser's localStorage. Optional Google Sheets upload is enabled by entering SHOP_KEY in Settings on each selling device; no secret is embedded in this repository. The key is kept in localStorage: people with access to that browser can retrieve it. New sales queue durably in the same local sale record, and a readable matching Apps Script acknowledgement is required before marking them synced. Network failures remain pending; retry uses the original ID. Old local-only sales upload only after explicit confirmation (including any test orders). This is one-way upload, NOT cross-device history synchronization. Health check and unauthorized CORS POST were verified; a real successful Sheets write needs the owner's key and sheet read-back. Use one checkout tab at a time. Clearing local site data removes unsent sales and the device key. Export CSV regularly. Private browsing storage is temporary. Transfer mode does not verify bank payment. No tax invoice, stock management or staff authentication. Brand is a placeholder.

## Development
Node 22+. Run `npm ci && npm test`. Serve this folder with `python -m http.server 8765`. For browser verification: `npx playwright install chromium && npm run test:e2e`. Set POS_URL to test a deployed URL. Browser tests use an isolated temporary browser profile, never real sales.

## Deployment
GitHub Pages Actions publishes only index.html, style.css, app.js and core.js after tests pass on main.
