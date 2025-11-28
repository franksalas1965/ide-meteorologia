// Utilidad para obtener configuraciones en runtime
export const getRuntimeConfig = (): { configUrl: string } => {
  if (typeof window === "undefined") {
    // Server side - usa variable de entorno o valor por defecto
    return {
      configUrl: process.env.NEXT_PUBLIC_CONFIG_URL || "/config",
    };
  }

  // Client side - busca configuración runtime primero
  const runtimeConfig = (window as any).__RUNTIME_CONFIG__;

  return {
    configUrl:
      runtimeConfig?.NEXT_PUBLIC_CONFIG_URL ||
      process.env.NEXT_PUBLIC_CONFIG_URL ||
      "/config",
  };
};
