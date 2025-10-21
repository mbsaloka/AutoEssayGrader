import { ApiError } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RequestConfig extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    
    // Try to get from cookie first
    const cookieToken = this.getCookieValue("token");
    if (cookieToken) return cookieToken;
    
    // Fall back to localStorage
    return localStorage.getItem("token");
  }

  private getCookieValue(name: string): string | null {
    if (typeof window === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null;
    }
    return null;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If JSON parsing fails, use the default error message
      }
      
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const token = config?.token || this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(config?.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const token = config?.token || this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(config?.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const token = config?.token || this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(config?.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const token = config?.token || this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(config?.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const token = config?.token || this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(config?.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      headers,
      ...config,
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(endpoint: string, formData: FormData, config?: RequestConfig): Promise<T> {
    const token = config?.token || this.getAuthToken();
    const headers: HeadersInit = {
      ...(config?.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Note: Do NOT set Content-Type for FormData, let the browser set it with boundary
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
      ...config,
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_URL);

