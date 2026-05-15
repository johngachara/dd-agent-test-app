const BASE_URL = process.env.VITE_API_URL ?? "https://api.example.com";

interface RequestOptions {
  token?: string;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

async function postForm<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: formData });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>("POST", path, body, options),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>("PATCH", path, body, options),
  postForm,
};
