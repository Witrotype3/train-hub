# Train Hub - client

This is a small client-side single page app (SPA) demo for the Train Hub project.

Features:
- Create an account (stored in localStorage)
- Sign in / Sign out
- Inventory: add and view items
- Training: access training modules or videos (placeholders)

How to run:
1. Open `client/index.html` in your browser (double-click or use your editor to open).
2. Create an account, then visit Inventory or Training.

Notes:
- This is a front-end demo only and uses localStorage for persistence. Passwords are stored in plain text in localStorage — this is only for demo purposes. Do NOT use this approach in production.
- To connect with a real backend, replace the `client/js/auth.js` functions with API calls and adjust routing as needed.
