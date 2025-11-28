const fs = require("fs-extra");
const path = require("path");

async function copyConfigFiles() {
  try {
    const sourceDir = path.join(process.cwd(), "public", "config");
    const standaloneDir = path.join(
      process.cwd(),
      ".next",
      "standalone",
      "public",
      "config"
    );
    const staticDir = path.join(process.cwd(), ".next", "static");

    // Crear directorios si no existen
    await fs.ensureDir(standaloneDir);
    await fs.ensureDir(staticDir);

    // Copiar archivos de configuración
    if (fs.existsSync(sourceDir)) {
      await fs.copy(sourceDir, standaloneDir);
      console.log("✅ Archivos de configuración copiados a standalone");
    }

    // También copiar a static para desarrollo
    const staticConfigDir = path.join(staticDir, "config");
    await fs.ensureDir(staticConfigDir);
    if (fs.existsSync(sourceDir)) {
      await fs.copy(sourceDir, staticConfigDir);
      console.log("✅ Archivos de configuración copiados a static");
    }
  } catch (error) {
    console.error("❌ Error copiando archivos de configuración:", error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  copyConfigFiles();
}

module.exports = copyConfigFiles;
