// Copies SQL migrations next to compiled output (tsc emits JS only).
const { cpSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");
const src = join(__dirname, "..", "src", "persistence", "migrations");
const dest = join(__dirname, "..", "dist", "persistence", "migrations");
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
const mjsSrc = join(__dirname, "..", "performance", "disposableDb.mjs");
const mjsDest = join(__dirname, "..", "dist", "performance", "disposableDb.mjs");
mkdirSync(join(__dirname, "..", "dist", "performance"), { recursive: true });
cpSync(mjsSrc, mjsDest);
console.log("migrations copied");
console.log("disposableDb.mjs copied");
