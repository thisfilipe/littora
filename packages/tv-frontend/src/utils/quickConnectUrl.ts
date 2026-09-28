export function getQuickConnectUrl(
    code: string | null | undefined,
    server: string | null | undefined
): string | null {
    if (!code) return null;
    if (!server) return null;

    const url = new URL(server);
    url.pathname = '/web/';
    url.hash = `/quickconnect?code=${encodeURIComponent(code)}`;

    return url.toString();
}
