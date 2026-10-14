// client.ts — Typed fetch wrapper for interacting with the Carpool REST API.
const BASE = '/api';
export class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}
async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(res.status, body.error || res.statusText || 'An unexpected error occurred');
    }
    return res.json();
}
export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: (path, body) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
