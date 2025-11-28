#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const configUrl = process.argv[2] || "/config";

const configContent = `// Configuración runtime - puede ser modificada después del build
window.__RUNTIME_CONFIG__ = {
  NEXT_PUBLIC_CONFIG_URL: '${configUrl}'
};`;

const outputPath = path.join(process.cwd(), "public", "runtime-config.js");
fs.writeFileSync(outputPath, configContent);

console.log(`✅ Configuración runtime generada: ${configUrl}`);
