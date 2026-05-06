export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function requestJson<TResponse>(
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.error ?? "Request failed";
    throw new ApiError(message, response.status);
  }

  return body as TResponse;
}
