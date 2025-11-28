// src/config/proxyResolver.ts
interface ProxyConfig {
  prefix: string;
  target: string;
  replacePath: boolean;
}

const DEFAULT_PROXIES: ProxyConfig[] = [
  {
    prefix: "/proxy/geocuba/",
    target: "https://idevida.geocuba.cu/",
    replacePath: true,
  },
];

let proxyConfigCache: ProxyConfig[] | null = null;

export const loadProxyConfig = async (): Promise<ProxyConfig[]> => {
  if (proxyConfigCache) return proxyConfigCache;

  try {
    const configUrl = process.env.NEXT_PUBLIC_CONFIG_URL || "/config";
    const response = await fetch(`${configUrl}/proxyConfig.json`);

    if (!response.ok) {
      console.warn("Using default proxy config (failed to load custom config)");
      return DEFAULT_PROXIES;
    }

    const data = await response.json();
    proxyConfigCache = [...DEFAULT_PROXIES, ...(data.proxies || [])];
    return proxyConfigCache;
  } catch (error) {
    console.error("Error loading proxy config, using defaults:", error);
    return DEFAULT_PROXIES;
  }
};

export const resolveProxyUrl = async (url: string): Promise<string> => {
  // Si ya es una URL completa o no necesita proxy
  if (/^https?:\/\//i.test(url)) return url;

  const proxyConfigs = await loadProxyConfig();

  // 1. Buscar coincidencia de prefijo
  for (const config of proxyConfigs) {
    if (url.startsWith(config.prefix)) {
      const cleanTarget = config.target.replace(/\/+$/, "");
      const cleanPrefix = config.prefix.replace(/\/+$/, "");

      const path = config.replacePath
        ? url.replace(new RegExp(`^${cleanPrefix}\/?`), "")
        : url;

      return `${cleanTarget}/${path}`.replace(/([^:]\/)\/+/g, "$1");
    }
  }

  // 2. Manejar URLs relativas
  const baseUrl = window.location.origin;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Nueva función para aplicar prefijo (opuesta a resolveProxyUrl)
export const applyProxyPrefix = async (
  originalUrl: string
): Promise<string> => {
  const proxyConfigs = await loadProxyConfig();

  // 1. Buscar si la URL coincide con algún target
  for (const config of proxyConfigs) {
    if (originalUrl.startsWith(config.target)) {
      return originalUrl.replace(config.target, config.prefix);
    }
    // Si ya tiene el prefijo, dejarla igual
    if (originalUrl.startsWith(config.prefix)) {
      return originalUrl;
    }
  }

  return originalUrl;
};
