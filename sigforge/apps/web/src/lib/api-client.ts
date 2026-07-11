"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface TokenStore {
  accessToken?: string;
  refreshToken?: string;
}

const TOKEN_KEY = "sigforge.tokens";

export function getTokens(): TokenStore {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as TokenStore;
  } catch {
    return {};
  }
}

export function setTokens(tokens: TokenStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tokens = getTokens();
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body && typeof init.body === "string") {
    headers.set("content-type", "application/json");
  }
  if (tokens.accessToken) headers.set("authorization", `Bearer ${tokens.accessToken}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const API_BASE = API_URL;
