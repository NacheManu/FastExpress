const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export interface ApiErrorDetail {
  field: string;
  message: string;
}

/** Error devuelto por la API (o de red, con status 0) con el formato { error: { code, message, details } }. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor. Comprueba tu conexión.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: Partial<ApiError> } | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? `El servidor respondió con un error (${response.status}).`,
      error?.details ?? [],
    );
  }
  return body as T;
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, data: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data), signal }),
};
