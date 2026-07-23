const express = require("express");
const bcrypt = require("bcryptjs");
const path = require("path");
const { Document, Packer, Paragraph, HeadingLevel, TextRun } = require("docx");

const store = require("./data/store");
const { QUESTION_BANK } = require("./data/questions");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- Auth middleware ----------------------------------------------------
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token ? store.getUserByToken(token) : null;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ---- Auth routes ---------------------------------------------------------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const user = store.findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = store.createSession(user.id);
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, module: user.module }
  });
});

app.post("/api/logout", authenticate, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.slice(7);
  store.destroySession(token);
  res.json({ ok: true });
});

app.get("/api/me", authenticate, (req, res) => {
  const { id, username, role, module } = req.user;
  res.json({ id, username, role, module });
});

// ---- Admin routes ---------------------------------------------------------
app.get("/api/admin/users", authenticate, requireAdmin, (req, res) => {
  res.json(store.listUsers());
});

app.post("/api/admin/users", authenticate, requireAdmin, (req, res) => {
  const { username, password, module } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  if (module && !["VIII CBSE", "NEET"].includes(module)) {
    return res.status(400).json({ error: "Module must be 'VIII CBSE' or 'NEET'" });
  }
  try {
    const user = store.createUser({ username, password, module });
    const { passwordHash, ...safe } = user;
    res.status(201).json(safe);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/admin/users/:id/module", authenticate, requireAdmin, (req, res) => {
  const { module } = req.body || {};
  try {
    const user = store.assignModule(req.params.id, module);
    const { passwordHash, ...safe } = user;
    res.json(safe);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Question routes (regular users) --------------------------------------
app.get("/api/questions", authenticate, (req, res) => {
  if (req.user.role === "admin") {
    return res.status(403).json({ error: "Admins do not have an assigned module" });
  }
  if (!req.user.module) {
    return res.status(409).json({ error: "No module assigned yet. Ask your admin." });
  }
  res.json({
    module: req.user.module,
    questions: QUESTION_BANK[req.user.module]
  });
});

// ---- Export selected questions to DOCX ------------------------------------
app.post("/api/export", authenticate, async (req, res) => {
  if (req.user.role === "admin" || !req.user.module) {
    return res.status(403).json({ error: "Only assigned users can export questions" });
  }
  const { questionIds } = req.body || {};
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return res.status(400).json({ error: "questionIds must be a non-empty array" });
  }

  const bank = QUESTION_BANK[req.user.module] || [];
  const selected = bank.filter((q) => questionIds.includes(q.id));
  if (selected.length === 0) {
    return res.status(400).json({ error: "No matching questions found" });
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `${req.user.module} — Selected Questions`,
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Exported for: ${req.user.username}`, italics: true })
            ]
          }),
          new Paragraph({ text: "" }),
          ...selected.flatMap((q, idx) => [
            new Paragraph({
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true }),
                new TextRun({ text: q.text })
              ]
            }),
            new Paragraph({ text: "" })
          ])
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${req.user.module.replace(/\s+/g, "_")}_selected_questions.docx"`
  );
  res.send(buffer);
});

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Default admin login -> username: admin / password: admin123");
  });
}

module.exports = app;
