import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../../data/database.sqlite");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

export default db; 