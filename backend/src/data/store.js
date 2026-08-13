const fs = require("fs");
const path = require("path");

// A tiny synchronous, file-backed JSON datastore.
//
// This project intentionally avoids a native database driver (sqlite3,
// better-sqlite3, postgres, etc.) so the backend runs anywhere with zero
// build tooling and zero external services. Swap this module out for a
// real database layer (Prisma, Knex, Mongoose...) when you outgrow it —
// every controller only talks to the `db` object below, so that's the
// only file you'd need to replace.

const DB_FILE = path.join(__dirname, "db.json");

const EMPTY_DB = {
  users: [],
  freelancers: [],
  gigs: [],
  proposals: [],
  messages: [],
};

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2));
    return structuredClone(EMPTY_DB);
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return { ...structuredClone(EMPTY_DB), ...parsed };
  } catch (err) {
    throw new Error(`Failed to parse ${DB_FILE}: ${err.message}`);
  }
}

let state = load();

function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

// Generic collection accessor: db.collection('gigs').find(...) etc.
function collection(name) {
  if (!state[name]) state[name] = [];

  return {
    all() {
      return [...state[name]];
    },
    find(predicate) {
      return state[name].filter(predicate);
    },
    findOne(predicate) {
      return state[name].find(predicate) || null;
    },
    findById(id) {
      return state[name].find((row) => row.id === id) || null;
    },
    insert(row) {
      state[name].push(row);
      persist();
      return row;
    },
    updateById(id, patch) {
      const idx = state[name].findIndex((row) => row.id === id);
      if (idx === -1) return null;
      state[name][idx] = { ...state[name][idx], ...patch, id: state[name][idx].id };
      persist();
      return state[name][idx];
    },
    removeById(id) {
      const idx = state[name].findIndex((row) => row.id === id);
      if (idx === -1) return false;
      state[name].splice(idx, 1);
      persist();
      return true;
    },
    replaceAll(rows) {
      state[name] = rows;
      persist();
    },
  };
}

function resetForSeed(newState) {
  state = { ...structuredClone(EMPTY_DB), ...newState };
  persist();
}

module.exports = { collection, resetForSeed, DB_FILE };
