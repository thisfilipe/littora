import type {
    AuthenticatedProfileInput,
    DeviceSession,
    SavedProfile,
    SavedServer,
} from './types';

const PROFILE_STORE_KEY = 'littora.profile-store.v1';
const LEGACY_SERVER_KEY = 'jf_server';
const LEGACY_USER_KEY = 'jf_user';
const LEGACY_TOKEN_KEY = 'jf_token';

interface KeyValueStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

interface PersistedProfileStore {
    version: 1;
    servers: SavedServer[];
    profiles: SavedProfile[];
    session: DeviceSession;
    migrations: {
        legacyCredentialsImported: boolean;
    };
}

function browserStorage(): KeyValueStorage {
    if (typeof localStorage === 'undefined') {
        throw new Error('Profile storage is only available in a browser environment');
    }
    return localStorage;
}

function emptyStore(): PersistedProfileStore {
    return {
        version: 1,
        servers: [],
        profiles: [],
        session: {
            activeProfileId: null,
            selectedServerId: null,
            lastUsedProfileId: null,
        },
        migrations: {
            legacyCredentialsImported: false,
        },
    };
}

function parseStore(serialized: string): PersistedProfileStore {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object') {
        throw new Error('Saved profile data is invalid');
    }

    const store = value as Partial<PersistedProfileStore>;
    if (
        store.version !== 1 ||
        !Array.isArray(store.servers) ||
        !Array.isArray(store.profiles) ||
        !store.session ||
        !store.migrations
    ) {
        throw new Error('Saved profile data has an unsupported format');
    }

    return store as PersistedProfileStore;
}

function removeLegacyKeys(storage: KeyValueStorage): void {
    storage.removeItem(LEGACY_SERVER_KEY);
    storage.removeItem(LEGACY_USER_KEY);
    storage.removeItem(LEGACY_TOKEN_KEY);
}

function stableServerId(url: string): string {
    return `server:${url}`;
}

function stableProfileId(serverId: string, userId: string): string {
    return `profile:${encodeURIComponent(serverId)}:${encodeURIComponent(userId)}`;
}

function migrateLegacyCredentials(storage: KeyValueStorage): PersistedProfileStore {
    const serverUrl = storage.getItem(LEGACY_SERVER_KEY)?.trim() ?? '';
    const userId = storage.getItem(LEGACY_USER_KEY)?.trim() ?? '';
    const accessToken = storage.getItem(LEGACY_TOKEN_KEY) ?? '';

    // Without a server, the old user/token pair cannot form a usable session.
    // Leave the original keys untouched so a later recovery can inspect them.
    if (!serverUrl) return emptyStore();

    const store = emptyStore();
    const server: SavedServer = { id: stableServerId(serverUrl), url: serverUrl };
    store.servers.push(server);
    store.session.selectedServerId = server.id;

    if (userId && accessToken) {
        const profile: SavedProfile = {
            id: stableProfileId(server.id, userId),
            serverId: server.id,
            jellyfinUserId: userId,
            accessToken,
            displayName: userId,
            lastUsedAt: Date.now(),
        };
        store.profiles.push(profile);
        store.session.activeProfileId = profile.id;
        store.session.lastUsedProfileId = profile.id;
    }

    store.migrations.legacyCredentialsImported = true;
    const serialized = JSON.stringify(store);
    storage.setItem(PROFILE_STORE_KEY, serialized);

    // Keep the legacy tuple until the new record can be read back successfully.
    if (storage.getItem(PROFILE_STORE_KEY) !== serialized) {
        throw new Error('Could not confirm migration of saved profile data');
    }
    removeLegacyKeys(storage);
    return store;
}

function readStore(storage: KeyValueStorage): PersistedProfileStore {
    const serialized = storage.getItem(PROFILE_STORE_KEY);
    if (serialized === null) return migrateLegacyCredentials(storage);

    const store = parseStore(serialized);
    if (store.migrations.legacyCredentialsImported) {
        // This also completes cleanup if the app stopped after writing v1 data.
        removeLegacyKeys(storage);
    }
    return store;
}

function writeStore(storage: KeyValueStorage, store: PersistedProfileStore): void {
    storage.setItem(PROFILE_STORE_KEY, JSON.stringify(store));
}

function updateStore(update: (store: PersistedProfileStore) => void): void {
    const storage = browserStorage();
    const store = readStore(storage);
    update(store);
    writeStore(storage, store);
}

function findServer(store: PersistedProfileStore, serverId: string | null): SavedServer | null {
    if (!serverId) return null;
    return store.servers.find((server) => server.id === serverId) ?? null;
}

function upsertServer(store: PersistedProfileStore, url: string): SavedServer {
    const existing = store.servers.find((server) => server.url === url);
    if (existing) return existing;

    const server = { id: stableServerId(url), url };
    store.servers.push(server);
    return server;
}

function copyProfile(profile: SavedProfile): SavedProfile {
    return { ...profile };
}

export function getSavedServers(): SavedServer[] {
    return readStore(browserStorage()).servers.map((server) => ({ ...server }));
}

export function getSavedProfiles(): SavedProfile[] {
    return readStore(browserStorage()).profiles.map(copyProfile);
}

export function getActiveProfile(): SavedProfile | null {
    const store = readStore(browserStorage());
    const profile =
        store.profiles.find((candidate) => candidate.id === store.session.activeProfileId) ?? null;
    return profile ? copyProfile(profile) : null;
}

export function getLastUsedProfileId(): string | null {
    return readStore(browserStorage()).session.lastUsedProfileId;
}

export function getSelectedServerUrl(): string | null {
    const store = readStore(browserStorage());
    const activeProfile = store.profiles.find(
        (profile) => profile.id === store.session.activeProfileId
    );
    return (
        findServer(store, activeProfile?.serverId ?? store.session.selectedServerId)?.url ??
        (store.servers.length === 1 ? store.servers[0].url : null)
    );
}

export function getActiveUserId(): string | null {
    return getActiveProfile()?.jellyfinUserId ?? null;
}

export function getActiveAccessToken(): string | null {
    return getActiveProfile()?.accessToken ?? null;
}

export function saveSelectedServerUrl(serverUrl: string): void {
    updateStore((store) => {
        const previousServerId = store.session.selectedServerId;
        if (!serverUrl) {
            store.session.selectedServerId = null;
            store.session.activeProfileId = null;
            return;
        }

        const server = upsertServer(store, serverUrl);
        store.session.selectedServerId = server.id;
        const activeProfile = store.profiles.find(
            (profile) => profile.id === store.session.activeProfileId
        );
        if (
            activeProfile &&
            activeProfile.serverId !== server.id &&
            previousServerId !== server.id
        ) {
            // Never combine one server's token with another server's URL.
            store.session.activeProfileId = null;
        }
    });
}

export function saveAuthenticatedProfile(input: AuthenticatedProfileInput): SavedProfile {
    const serverUrl = input.serverUrl.trim();
    const userId = input.jellyfinUserId.trim();
    if (!serverUrl || !userId || !input.accessToken) {
        throw new Error('Server, Jellyfin user ID, and access token are required');
    }

    const storage = browserStorage();
    const store = readStore(storage);
    const server = upsertServer(store, serverUrl);
    const existing = store.profiles.find(
        (profile) => profile.serverId === server.id && profile.jellyfinUserId === userId
    );
    const profile: SavedProfile = {
        ...existing,
        id: existing?.id ?? stableProfileId(server.id, userId),
        serverId: server.id,
        jellyfinUserId: userId,
        accessToken: input.accessToken,
        displayName: input.displayName.trim() || userId,
        avatarUrl: input.avatarUrl ?? existing?.avatarUrl,
        lastUsedAt: Date.now(),
        requiresAuthentication: false,
    };

    if (existing) {
        store.profiles = store.profiles.map((candidate) =>
            candidate.id === existing.id ? profile : candidate
        );
    } else {
        store.profiles.push(profile);
    }
    store.session.selectedServerId = server.id;
    store.session.activeProfileId = profile.id;
    store.session.lastUsedProfileId = profile.id;
    writeStore(storage, store);
    return copyProfile(profile);
}

export function activateProfile(profileId: string): SavedProfile {
    const storage = browserStorage();
    const store = readStore(storage);
    const profile = store.profiles.find((candidate) => candidate.id === profileId);
    if (!profile) throw new Error('Saved profile was not found');
    if (profile.requiresAuthentication) throw new Error('Saved profile requires authentication');
    if (!findServer(store, profile.serverId)) throw new Error('Saved profile server was not found');

    profile.lastUsedAt = Date.now();
    store.session.activeProfileId = profile.id;
    store.session.selectedServerId = profile.serverId;
    store.session.lastUsedProfileId = profile.id;
    writeStore(storage, store);
    return copyProfile(profile);
}

export function leaveSession(): void {
    updateStore((store) => {
        store.session.activeProfileId = null;
    });
}

export function markActiveProfileRequiresAuthentication(): SavedProfile | null {
    const storage = browserStorage();
    const store = readStore(storage);
    const profile = store.profiles.find(
        (candidate) => candidate.id === store.session.activeProfileId
    );
    if (!profile) return null;

    profile.requiresAuthentication = true;
    store.session.activeProfileId = null;
    writeStore(storage, store);
    return copyProfile(profile);
}

export function removeSavedProfile(profileId: string): void {
    updateStore((store) => {
        store.profiles = store.profiles.filter((profile) => profile.id !== profileId);
        if (store.session.activeProfileId === profileId) store.session.activeProfileId = null;
        if (store.session.lastUsedProfileId === profileId) store.session.lastUsedProfileId = null;
    });
}

/** Explicitly disconnects one server and removes only profiles tied to it. */
export function disconnectSavedServer(serverId: string): void {
    updateStore((store) => {
        const removedProfileIds = new Set(
            store.profiles.filter((profile) => profile.serverId === serverId).map((p) => p.id)
        );
        store.servers = store.servers.filter((server) => server.id !== serverId);
        store.profiles = store.profiles.filter((profile) => profile.serverId !== serverId);
        if (store.session.selectedServerId === serverId) store.session.selectedServerId = null;
        if (store.session.activeProfileId && removedProfileIds.has(store.session.activeProfileId)) {
            store.session.activeProfileId = null;
        }
        if (
            store.session.lastUsedProfileId &&
            removedProfileIds.has(store.session.lastUsedProfileId)
        ) {
            store.session.lastUsedProfileId = null;
        }
    });
}
