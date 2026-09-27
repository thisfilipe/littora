import { logoutFromSeerr } from '../api/seerr/logout';
import { markActiveProfileRequiresAuthentication } from '../profiles/profileStore';
import { withBasePath } from './basePath';

export function isAuthError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        return status === 401 || status === 403;
    }
    return false;
}

const defaultAuthRedirect = () => {
    window.location.href = withBasePath('/login');
};

let onAuthRedirect: () => void = defaultAuthRedirect;

export function setAuthRedirectHandler(handler: () => void) {
    onAuthRedirect = handler;
}

export function resetAuthRedirectHandler() {
    onAuthRedirect = defaultAuthRedirect;
}

export function clearAuthAndRedirect() {
    void logoutFromSeerr();
    markActiveProfileRequiresAuthentication();

    onAuthRedirect();
}

export function getRetryConfig() {
    return {
        retry: (failureCount: number, error: unknown) => {
            if (isAuthError(error)) {
                clearAuthAndRedirect();
                return false;
            }
            return failureCount < 3;
        },
    };
}
