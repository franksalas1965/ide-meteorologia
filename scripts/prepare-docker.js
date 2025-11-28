const fs = require("fs");
const path = require("path");

// Crear archivos de configuración por defecto si no existen
const configDir = path.join(__dirname, "..", "public", "config");
const runtimeConfig = path.join(__dirname, "..", "public", "runtime-config.js");

// Crear directorio config si no existe
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log("📁 Created config directory");
}

// Crear archivos de configuración por defecto
const defaultConfigs = {
  "menu.json": JSON.stringify({ menu: [] }, null, 2),
  "baseLayers.json": JSON.stringify([], null, 2),
  "appConfig.json": JSON.stringify({ version: "1.0.0" }, null, 2),
};

Object.entries(defaultConfigs).forEach(([filename, content]) => {
  const filePath = path.join(configDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`📄 Created default ${filename}`);
  }
});

// Crear runtime config si no existe
if (!fs.existsSync(runtimeConfig)) {
  fs.writeFileSync(
    runtimeConfig,
    'window.__RUNTIME_CONFIG__ = { NEXT_PUBLIC_CONFIG_URL: "/config" }'
  );
  console.log("📄 Created runtime-config.js");
}

console.log("✅ Docker preparation completed");
