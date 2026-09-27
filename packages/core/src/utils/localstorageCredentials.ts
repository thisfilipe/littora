import {
    getActiveAccessToken,
    getActiveUserId,
    getSelectedServerUrl,
    leaveSession,
    saveAuthenticatedProfile,
    saveSelectedServerUrl,
} from '../profiles/profileStore';

export function getServerUrl(): string | null {
    return getSelectedServerUrl();
}

export function saveServerUrl(serverUrl: string): void {
    saveSelectedServerUrl(serverUrl);
}

export function getUserId(): string | null {
    return getActiveUserId();
}

export function getAccessToken(): string | null {
    return getActiveAccessToken();
}

export function saveCredentials(serverUrl: string, userId: string, accessToken: string): void {
    saveAuthenticatedProfile({
        serverUrl,
        jellyfinUserId: userId,
        accessToken,
        displayName: userId,
    });
}

/** @deprecated Use leaveSession, removeSavedProfile, or disconnectSavedServer explicitly. */
export function clearCredentials(): void {
    leaveSession();
}
