import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parsed = dotenv.config({ path: path.join(root, ".env") }).parsed || {};
const python = path.join(root, ".venv", "bin", "python");

if (!fs.existsSync(python)) {
  console.error("Admin/.venv ausente. Execute: python3 -m venv .venv && .venv/bin/pip install -r admin_api/requirements.txt");
  process.exit(1);
}

const env = {
  ...process.env,
  ...parsed,
  ADMIN_DATA_API_URL: "http://127.0.0.1:5185",
};

const services = [
  [python, ["-m", "uvicorn", "admin_api.main:app", "--host", "127.0.0.1", "--port", "5185"], "admin-api"],
  [process.execPath, ["server/index.js"], "admin-server"],
  [path.join(root, "node_modules", ".bin", "vite"), ["--host", "0.0.0.0", "--port", "5174", "--strictPort"], "admin-web"],
];

const children = services.map(([command, args, name]) => {
  const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
  child.on("exit", (code, signal) => {
    if (!stopping && (code !== 0 || signal)) {
      console.error(`${name} encerrou (${signal || code}); finalizando o ambiente local.`);
      stop(code || 1);
    }
  });
  return child;
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
