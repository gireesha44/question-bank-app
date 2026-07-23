# Question Bank App

A small full-stack app built for the internship assignment:

- Login page
- Admin creates users
- Admin assigns "VIII CBSE" or "NEET" to each user
- User logs in and sees only their assigned module
- 20 dummy questions per module
- Clicking "+" adds a question to a preview panel
- "Export to DOCX" downloads the selected questions as a real Word document

## Stack

- **Backend:** Node.js + Express, plain in-memory data store (no external DB needed to run this)
- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **Auth:** username/password with bcrypt-hashed passwords + a simple bearer-token session
- **DOCX generation:** the `docx` npm package, run server-side, so the exported file is a genuine `.docx`

## Running it

```bash
npm install
node server.js
```

Then open http://localhost:3000 in your browser.

**Default admin login:** `admin` / `admin123`

## How to try the full flow

1. Log in as `admin` / `admin123` → you land on the Admin Dashboard.
2. Create a new user (e.g. username `student1`, password `pass123`), assigning the module `VIII CBSE` or `NEET` (or leave unassigned and assign it later from the user table).
3. Log out, log back in as that new user.
4. You'll see only the 20 questions for their assigned module.
5. Click "+" next to a few questions — they move into the Preview panel on the right.
6. Click "Export to DOCX" — a `.docx` file downloads containing the selected questions.

## Project structure

```
question-bank-app/
├── server.js              # Express app: auth, admin, questions, export routes
├── data/
│   ├── store.js           # In-memory users/sessions ("database" layer)
│   └── questions.js        # 20 dummy questions each for VIII CBSE and NEET
├── public/
│   ├── index.html         # Login page
│   ├── admin.html          # Admin dashboard (create users, assign modules)
│   ├── user.html            # User dashboard (questions + preview panel + export)
│   └── styles.css
└── package.json
```

## Notes on design choices

- **In-memory store instead of a real DB:** keeps the assignment runnable with zero setup (no Mongo/Postgres to install). The `data/store.js` module is isolated so it could be swapped for a real database layer without touching routes.
- **Bearer token sessions:** simple and stateless enough for a small assignment, while keeping passwords properly hashed (bcrypt) rather than stored in plaintext.
- **Role-based access:** `requireAdmin` middleware protects all admin routes; regular users can never see the admin's endpoints or another module's questions — the assigned module is read server-side from the authenticated user's record, not trusted from the client.
- **Real DOCX output:** generated with the `docx` library on the server, so the file is a genuine Word document, not just HTML renamed to `.docx`.

## Restarting / resetting data

Since data is in-memory, restarting the server resets everything back to just the default admin account.
