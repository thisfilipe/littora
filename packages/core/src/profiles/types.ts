export interface SavedServer {
    id: string;
    url: string;
    name?: string;
}

export interface SavedProfile {
    id: string;
    serverId: string;
    jellyfinUserId: string;
    accessToken: string;
    displayName: string;
    /** Jellyfin username used for password reauthentication, when known. */
    username?: string;
    avatarUrl?: string;
    lastUsedAt?: number;
    requiresAuthentication?: boolean;
}

export interface DeviceSession {
    activeProfileId: string | null;
    selectedServerId: string | null;
    lastUsedProfileId: string | null;
}

export interface AuthenticatedProfileInput {
    serverUrl: string;
    jellyfinUserId: string;
    accessToken: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
}
