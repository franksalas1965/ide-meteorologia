#!/bin/sh

# Script para build con Docker que maneja dependencias correctamente

echo "🔨 Building Docker image..."

# Primero instalar dependencias localmente si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Construir la aplicación
echo "🏗️ Building application..."
npm run build

# Verificar que el build se completó correctamente
if [ ! -d ".next/standalone" ]; then
    echo "❌ Build failed - standalone directory not found"
    exit 1
fi

# Construir la imagen Docker
echo "🐳 Building Docker image..."
docker build -t IDE-METEOROLOGIA:latest .

echo "✅ Build completed successfully!"