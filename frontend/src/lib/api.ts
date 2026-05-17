'use client';

// ── Cookie helpers (client-side only) ─────────────────────────────────────────

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ── Token management ──────────────────────────────────────────────────────────

const ACCESS_COOKIE = 'mediagen_access';
const REFRESH_COOKIE = 'mediagen_refresh';

export const tokens = {
  getAccess: () => (typeof document !== 'undefined' ? getCookie(ACCESS_COOKIE) : null),
  getRefresh: () => (typeof document !== 'undefined' ? getCookie(REFRESH_COOKIE) : null),
  set: (access: string, refresh: string) => {
    setCookie(ACCESS_COOKIE, access, 7);
    setCookie(REFRESH_COOKIE, refresh, 30);
  },
  clear: () => {
    deleteCookie(ACCESS_COOKIE);
    deleteCookie(REFRESH_COOKIE);
  },
};

// ── Base fetch ────────────────────────────────────────────────────────────────

const DJANGO = process.env.NEXT_PUBLIC_DJANGO_URL ?? 'http://localhost:8000';

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokens.getRefresh();
  if (!refresh) return null;
  try {
    const res = await fetch(`${DJANGO}/api/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access: string };
    setCookie(ACCESS_COOKIE, data.access, 7);
    return data.access;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const access = tokens.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
  };

  const res = await fetch(`${DJANGO}/api${path}`, { ...init, headers });

  // Auto-refresh on 401 then retry once
  if (res.status === 401 && retry) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      return apiFetch(path, init, false);
    }
    tokens.clear();
    window.location.href = '/login';
  }

  return res;
}

// ── Typed API calls ───────────────────────────────────────────────────────────

export const djangoApi = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${DJANGO}/api/token/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? 'Login failed');
    }
    const data = (await res.json()) as { access: string; refresh: string };
    tokens.set(data.access, data.refresh);
    return data;
  },

  async signup(name: string, email: string, password: string) {
    const res = await fetch(`${DJANGO}/api/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { detail?: string }).detail ?? 'Signup failed');
    }
    return res.json();
  },

  async me() {
    const res = await apiFetch('/users/me');
    if (!res.ok) return null;
    return res.json() as Promise<{ id: number; name: string; email: string }>;
  },

  // Generations
  async createGeneration(data: {
    model_slug: string;
    prompt: string;
    negative_prompt?: string;
    provider?: string;
    params?: Record<string, unknown>;
  }) {
    const res = await apiFetch('/generations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create generation');
    return res.json() as Promise<{ id: string; status: string }>;
  },

  async listGenerations(params?: { modality?: string; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.modality) q.set('modality', params.modality);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await apiFetch(`/generations?${q}`);
    if (!res.ok) return [];
    return res.json();
  },

  async cancelGeneration(id: string) {
    const res = await apiFetch(`/generations/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel generation');
    return res.json();
  },

  // Assets
  async listAssets(params?: { type?: string; limit?: number; cursor?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.cursor) q.set('cursor', params.cursor);
    if (params?.search) q.set('search', params.search);
    const res = await apiFetch(`/generations/assets/list?${q}`);
    if (!res.ok) return { items: [], nextCursor: null };
    const items = await res.json();
    return { items: Array.isArray(items) ? items : [], nextCursor: null };
  },

  // Usage
  async usageSummary() {
    const res = await apiFetch('/generations/usage/summary');
    if (!res.ok) return null;
    return res.json();
  },
};

// Stream URL (EventSource) — access token appended as query param since
// EventSource doesn't support custom headers
export function streamUrl(generationId: string): string {
  const access = tokens.getAccess();
  const q = access ? `?token=${encodeURIComponent(access)}` : '';
  return `${DJANGO}/api/generations/${generationId}/stream${q}`;
}
