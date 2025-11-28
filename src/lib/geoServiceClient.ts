interface GeoRequestParams {
  url: string;
  type: "wms" | "wfs" | "arcgis";
  params: Record<string, string>;
  options?: RequestInit;
}

export const geoRequest = async ({
  url,
  type,
  params,
  options,
}: GeoRequestParams) => {
  const isRelative = url.startsWith("/");
  const isSameOrigin = url.startsWith(window.location.origin);
  const needsProxy = !isRelative && !isSameOrigin;

  const requestUrl = needsProxy ? `/api/proxy/${encodeURIComponent(url)}` : url;

  const serviceParams = {
    ...params,
    ...(type === "wms" && { service: "WMS", version: "1.3.0" }),
    ...(type === "wfs" && { service: "WFS", version: "2.0.0" }),
  };

  const queryString = new URLSearchParams(serviceParams).toString();

  try {
    const response = await fetch(`${requestUrl}?${queryString}`, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`GeoService error (${type}):`, error);
    throw error;
  }
};
