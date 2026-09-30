import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "contracts", "managed", "vault-bid");
const dest = join(root, "web", "public", "zk", "vault-bid");
const stale = join(root, "web", "public", "zk", "shade-pass");

if (!existsSync(join(src, "keys"))) {
  console.error("Missing managed keys. Run npm run compile:wsl first.");
  process.exit(1);
}

if (existsSync(stale)) {
  rmSync(stale, { recursive: true, force: true });
}

mkdirSync(dest, { recursive: true });
cpSync(join(src, "keys"), join(dest, "keys"), { recursive: true });
cpSync(join(src, "zkir"), join(dest, "zkir"), { recursive: true });
console.log("Synced ZK assets → web/public/zk/vault-bid");
