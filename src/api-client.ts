const BASE_URL = "https://api.rompslomp.nl/api/v1";

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

export interface ApiError {
  error: {
    type: string;
    message: string;
  };
}

export class RompslompClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | string[] | undefined>
  ): Promise<PaginatedResponse<T>> {
    const url = new URL(`${BASE_URL}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, v);
          }
        } else {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), options);
    } catch (err) {
      throw new Error(`Network error: ${err}`);
    }

    // Rate limit handling - retry once after waiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      response = await fetch(url.toString(), options);
    }

    if (response.status === 204) {
      return {
        data: {} as T,
        pagination: { page: 0, perPage: 0, total: 0 },
      };
    }

    const responseText = await response.text();

    if (!response.ok) {
      let errorMessage = `API error ${response.status}: ${responseText}`;
      try {
        const errorJson = JSON.parse(responseText) as ApiError;
        if (errorJson.error) {
          errorMessage = `[${errorJson.error.type}] ${errorJson.error.message}`;
        }
      } catch {
        // use raw text
      }
      throw new Error(errorMessage);
    }

    // Handle PDF responses (binary)
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/pdf")) {
      return {
        data: { pdf_base64: Buffer.from(responseText, "binary").toString("base64") } as T,
        pagination: { page: 0, perPage: 0, total: 0 },
      };
    }

    const data = JSON.parse(responseText) as T;

    const pagination = {
      page: parseInt(response.headers.get("X-Page") || "0", 10),
      perPage: parseInt(response.headers.get("X-Per-Page") || "0", 10),
      total: parseInt(response.headers.get("X-Total") || "0", 10),
    };

    return { data, pagination };
  }

  // --- Convenience methods ---

  async get<T>(path: string, query?: Record<string, string | string[] | undefined>) {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T>(path: string, body: unknown) {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body: unknown) {
    return this.request<T>("PATCH", path, body);
  }

  async del<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}
