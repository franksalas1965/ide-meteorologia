// hooks/useMenu.ts
"use client";

import { useEffect, useState } from "react";
import { MenuGroup } from "../types/menu";
import { getRuntimeConfig } from "../utils/runtimeConfig";

// Función para fetch con manejo de errores mejorado y tipos
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export default function useMenu() {
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = getRuntimeConfig();

        // Determinar la URL del menú
        let menuUrl: string;
        if (process.env.NODE_ENV === "development") {
          // Desarrollo: usar configuración local
          menuUrl = process.env.NEXT_PUBLIC_CONFIG_URL
            ? `${process.env.NEXT_PUBLIC_CONFIG_URL}/menu.json`
            : "/config/menu.json";
        } else {
          // Producción: usar configuración externa
          menuUrl = config.menuUrl;
        }

        // Añadir timestamp para evitar cache
        const timestamp = new Date().getTime();
        const urlWithCacheBuster = `${menuUrl}?v=${timestamp}`;

        console.log("Cargando menú desde:", urlWithCacheBuster);

        const response = await fetchWithTimeout(urlWithCacheBuster, {}, 15000);

        if (!response.ok) {
          throw new Error(
            `Error HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data: MenuGroup[] = await response.json();

        // Validar estructura del menú
        if (!Array.isArray(data)) {
          throw new Error("Formato de menú inválido: se esperaba un array");
        }

        setMenuGroups(data);
      } catch (err) {
        console.error("Error loading menu:", err);

        const errorMessage =
          err instanceof Error
            ? err.name === "AbortError"
              ? "Timeout: El menú tardó demasiado en cargar"
              : err.message
            : "Error desconocido al cargar el menú";

        setError(errorMessage);

        // Intentar fallback en desarrollo
        if (process.env.NODE_ENV === "development") {
          try {
            console.log("Intentando carga de fallback...");
            const fallbackResponse = await fetch("/menu.json");
            if (fallbackResponse.ok) {
              const fallbackData: MenuGroup[] = await fallbackResponse.json();
              setMenuGroups(fallbackData);
              setError(null);
              console.log("Menú cargado desde fallback");
            }
          } catch (fallbackError) {
            console.error("Fallback también falló:", fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();

    // Opcional: Recargar menú periódicamente en producción
    if (process.env.NODE_ENV === "production") {
      const interval = setInterval(fetchMenu, 300000); // Cada 5 minutos
      return () => clearInterval(interval);
    }
  }, []);

  return { menuGroups, loading, error };
}
