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
    avatarUrl?: string;
}
