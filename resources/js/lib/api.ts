/**
 * Wrapper around the native `fetch` API for hitting the app's JSON API
 * endpoints (e.g. `/api/notifications/...`).
 *
 * These routes are registered inside the Inertia `web` middleware stack, so
 * we explicitly send `X-Inertia: false` to tell Inertia not to treat the
 * request as an Inertia request. Without this, a request that carries an
 * `X-Inertia` header would make the Inertia client throw
 * "Inertia requests must receive a valid Inertia response" whenever the
 * server responds with a plain JSON body.
 */
export async function apiFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<Response> {
    const headers = new Headers(init.headers ?? {});
    headers.set('Accept', 'application/json');
    headers.set('X-Inertia', 'false');

    return fetch(input, { ...init, headers, credentials: 'include' });
}
