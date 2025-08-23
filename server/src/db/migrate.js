import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import db from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, "schema.sql");
const schema = readFileSync(schemaPath, "utf8");

try {
  db.exec(schema);
  console.log("Migrations applied.");
} catch (error) {
  console.error("Error applying migrations:", error);
  process.exit(1);
} 