import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const { path } = params;
  const targetUrl = decodeURIComponent(path.join("/"));

  if (!targetUrl) {
    return NextResponse.json(
      { error: "URL target is required" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`
    );
    const searchParams = new URL(request.url).searchParams;

    // Copia los parámetros de la solicitud original
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        // Opcional: Agrega headers de autenticación si es necesario
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
