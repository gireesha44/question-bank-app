const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// ---- In-memory "database" ----------------------------------------------
// This is intentionally simple (no external DB) so the assignment is easy
// to run with zero setup. Swap this module out for a real DB layer later.

const users = new Map(); // id -> { id, username, passwordHash, role, module }
const sessions = new Map(); // token -> userId

function seedAdmin() {
  const id = uuidv4();
  users.set(id, {
    id,
    username: "admin",
    passwordHash: bcrypt.hashSync("admin123", 8),
    role: "admin",
    module: null
  });
}
seedAdmin();

function findUserByUsername(username) {
  for (const u of users.values()) {
    if (u.username.toLowerCase() === username.toLowerCase()) return u;
  }
  return null;
}

function createUser({ username, password, module }) {
  if (findUserByUsername(username)) {
    throw new Error("Username already exists");
  }
  const id = uuidv4();
  const user = {
    id,
    username,
    passwordHash: bcrypt.hashSync(password, 8),
    role: "user",
    module: module || null
  };
  users.set(id, user);
  return user;
}

function listUsers() {
  return Array.from(users.values()).map(({ passwordHash, ...rest }) => rest);
}

function assignModule(userId, moduleName) {
  const user = users.get(userId);
  if (!user) throw new Error("User not found");
  if (!["VIII CBSE", "NEET"].includes(moduleName)) {
    throw new Error("Invalid module");
  }
  user.module = moduleName;
  return user;
}

function createSession(userId) {
  const token = uuidv4();
  sessions.set(token, userId);
  return token;
}

function getUserByToken(token) {
  const userId = sessions.get(token);
  if (!userId) return null;
  return users.get(userId) || null;
}

function destroySession(token) {
  sessions.delete(token);
}

module.exports = {
  users,
  findUserByUsername,
  createUser,
  listUsers,
  assignModule,
  createSession,
  getUserByToken,
  destroySession
};
