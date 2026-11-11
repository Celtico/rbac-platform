import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { DemoHttpError } from "./errors";
import { handleRequest } from "./server";

/**
 * Adaptador d'axios per a la demo: en lloc d'enviar la petició per xarxa, la
 * passa al backend del navegador (`server.ts`) i en retorna la resposta amb la
 * mateixa forma que tindria una resposta HTTP.
 */

function parseBody(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse {
  return { data, status, statusText: status < 400 ? "OK" : "Error", headers: new AxiosHeaders(), config, request: null };
}

export const demoAdapter: AxiosAdapter = async (config) => {
  const url = new URL(config.url ?? "/", "http://demo.local");
  const query: Record<string, unknown> = Object.fromEntries(url.searchParams);
  for (const [key, value] of Object.entries((config.params as Record<string, unknown> | undefined) ?? {})) {
    if (value !== undefined && value !== null) query[key] = value;
  }

  try {
    const data = await handleRequest({
      method: config.method ?? "get",
      path: url.pathname,
      query,
      body: parseBody(config.data),
    });
    return respond(config, config.method?.toLowerCase() === "post" ? 201 : 200, data);
  } catch (error) {
    const http = error instanceof DemoHttpError ? error : new DemoHttpError(500, error instanceof Error ? error.message : "Error intern de la demo");
    if (http.status >= 500) console.error("[demo]", error);
    const response = respond(config, http.status, http.body());
    throw new AxiosError(http.message, String(http.status), config, null, response);
  }
};
