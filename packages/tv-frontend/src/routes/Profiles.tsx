import { useMemo, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    activateProfile,
    disconnectSavedProfile,
    getActiveProfile,
    getLastUsedProfileId,
    getSavedProfiles,
    getSavedServers,
    getUserProfileImageUrl,
    leaveSession,
    logout,
    logoutFromSeerr,
    removeSavedProfile,
} from '@pelagica/core';
import type { SavedProfile, SavedServer } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, LogOut, Plus, Server, Trash2, UserRound } from 'lucide-react';
import { useNavigate } from '@/router';
import FocusableButton from '@/components/FocusableButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';

function profileInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export default function Profiles() {
    const { t } = useTranslation(['profiles', 'common', 'login']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [profiles, setProfiles] = useState<SavedProfile[]>(() => getSavedProfiles());
    const [servers, setServers] = useState<SavedServer[]>(() => getSavedServers());
    const [selectedServerId, setSelectedServerId] = useState<string | null>(() => {
        const initialProfiles = getSavedProfiles();
        const lastUsed = initialProfiles.find((profile) => profile.id === getLastUsedProfileId());
        return (
            lastUsed?.serverId ?? getActiveProfile()?.serverId ?? getSavedServers()[0]?.id ?? null
        );
    });
    const [showServerPicker, setShowServerPicker] = useState(false);
    const [focusedProfileId, setFocusedProfileId] = useState<string | null>(null);
    const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
    const [autoFocusDeleteProfileId, setAutoFocusDeleteProfileId] = useState<string | null>(null);
    const [profileFocusRequest, setProfileFocusRequest] = useState<{
        profileId: string;
        token: number;
    } | null>(null);
    const focusedProfileControls = useRef(new Set<string>());
    const focusDeleteAfterDisconnect = useRef<string | null>(null);
    const activeProfile = getActiveProfile();

    const selectedServer = useMemo(
        () => servers.find((server) => server.id === selectedServerId) ?? servers[0] ?? null,
        [servers, selectedServerId]
    );
    const serversById = useMemo(
        () => new Map(servers.map((server) => [server.id, server])),
        [servers]
    );
    const visibleProfiles = useMemo(
        () =>
            selectedServer
                ? profiles.filter((profile) => profile.serverId === selectedServer.id)
                : profiles,
        [profiles, selectedServer]
    );
    const firstProfileId = visibleProfiles.some((profile) => profile.id === getLastUsedProfileId())
        ? getLastUsedProfileId()
        : visibleProfiles[0]?.id;

    const refreshSavedData = () => {
        setProfiles(getSavedProfiles());
        setServers(getSavedServers());
    };

    const focusProfileAvatar = (profileId: string) => {
        focusedProfileControls.current.clear();
        focusDeleteAfterDisconnect.current = null;
        setAutoFocusDeleteProfileId(null);
        setFocusedProfileId(profileId);
        setProfileFocusRequest((current) => ({
            profileId,
            token: (current?.token ?? 0) + 1,
        }));
    };

    const endLocalSession = async () => {
        await queryClient.cancelQueries();
        if (getActiveProfile()) void logoutFromSeerr();
        leaveSession();
        queryClient.clear();
    };

    const addProfile = (server: SavedServer | null = selectedServer) => {
        const query = server ? `?server=${encodeURIComponent(server.url)}` : '';
        navigate(`/login${query}`, { mode: 'push' });
    };

    const selectProfile = async (profile: SavedProfile) => {
        if (activeProfile?.id === profile.id) {
            navigate(-1);
            return;
        }

        const server = servers.find((candidate) => candidate.id === profile.serverId);
        if (!server) {
            toast.add({ title: t('login:could_not_find_server'), type: 'error' });
            return;
        }

        await endLocalSession();
        refreshSavedData();

        if (profile.requiresAuthentication) {
            const query = new URLSearchParams({ profileId: profile.id, server: server.url });
            navigate(`/login?${query.toString()}`, { mode: 'push' });
            return;
        }

        try {
            activateProfile(profile.id);
            navigate('/', { mode: 'reset' });
        } catch {
            toast.add({ title: t('login:login_failed'), type: 'error' });
            refreshSavedData();
        }
    };

    const disconnectProfile = async (profile: SavedProfile) => {
        const currentProfile = getActiveProfile();
        if (currentProfile?.id === profile.id) {
            try {
                await logout(queryClient);
            } catch {
                // Logout clears the local session even when the server is unavailable.
            }
            focusProfileAvatar(profile.id);
            setPendingRemovalId(null);
            refreshSavedData();
            navigate('/profiles', { mode: 'reset' });
            return;
        } else {
            if (currentProfile) {
                focusDeleteAfterDisconnect.current = profile.id;
                setAutoFocusDeleteProfileId(profile.id);
            } else {
                // The action disappears as this profile becomes disconnected. Keep
                // spatial navigation anchored to its avatar so other profiles stay selectable.
                focusProfileAvatar(profile.id);
            }
            disconnectSavedProfile(profile.id);
        }
        setPendingRemovalId(null);
        refreshSavedData();
    };

    const confirmRemoval = (profile: SavedProfile) => {
        const currentProfile = getActiveProfile();
        if (!profile.requiresAuthentication || currentProfile?.id === profile.id) {
            return;
        }
        removeSavedProfile(profile.id);
        setPendingRemovalId(null);
        setFocusedProfileId(null);
        refreshSavedData();
    };

    const handleProfileNavigationFocus = (profileId: string, control: string) => {
        focusedProfileControls.current.add(`${profileId}:${control}`);
        setFocusedProfileId(profileId);
        if (focusDeleteAfterDisconnect.current === profileId && control === 'delete') {
            focusDeleteAfterDisconnect.current = null;
            setAutoFocusDeleteProfileId(null);
        } else if (
            focusDeleteAfterDisconnect.current &&
            focusDeleteAfterDisconnect.current !== profileId
        ) {
            focusDeleteAfterDisconnect.current = null;
            setAutoFocusDeleteProfileId(null);
        }
    };

    const handleProfileNavigationBlur = (profileId: string, control: string) => {
        focusedProfileControls.current.delete(`${profileId}:${control}`);
        window.setTimeout(() => {
            if (focusDeleteAfterDisconnect.current === profileId) return;
            const stillFocusedInProfile = [...focusedProfileControls.current].some((key) =>
                key.startsWith(`${profileId}:`)
            );
            if (!stillFocusedInProfile) {
                setFocusedProfileId((current) => (current === profileId ? null : current));
            }
        }, 0);
    };

    const handleProfileBlur = (event: FocusEvent<HTMLDivElement>, profileId: string) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocusedProfileId((current) => (current === profileId ? null : current));
        }
    };

    return (
        <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-8 px-8 py-10 md:px-12">
            <header className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <UserRound className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
                        <h1 className="text-3xl font-semibold">{t('profiles:who_is_watching')}</h1>
                    </div>

                    {selectedServer && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <Server
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <div className="flex min-w-0 flex-col">
                                <span className="max-w-xl truncate text-base font-medium">
                                    {selectedServer.name || selectedServer.url}
                                </span>
                                {selectedServer.name && (
                                    <span className="max-w-xl truncate text-xs text-muted-foreground">
                                        {selectedServer.url}
                                    </span>
                                )}
                            </div>
                            {servers.length > 1 && (
                                <FocusableButton
                                    variant="outline"
                                    size="sm"
                                    aria-expanded={showServerPicker}
                                    onClick={() => setShowServerPicker((open) => !open)}
                                >
                                    {t('profiles:change_server')}
                                    <ChevronDown
                                        className={`transition-transform ${showServerPicker ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                    />
                                </FocusableButton>
                            )}
                        </div>
                    )}
                </div>

                {activeProfile && (
                    <FocusableButton variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft aria-hidden="true" />
                        {t('profiles:return_to_app')}
                    </FocusableButton>
                )}
            </header>

            {showServerPicker && servers.length > 1 && (
                <section className="flex flex-col gap-3" aria-label={t('profiles:choose_server')}>
                    <h2 className="text-lg font-medium">{t('profiles:choose_server')}</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {servers.map((server) => (
                            <FocusableButton
                                key={server.id}
                                autoFocus={server.id === selectedServer?.id}
                                variant={server.id === selectedServer?.id ? 'secondary' : 'outline'}
                                className="h-auto min-h-14 w-full justify-start whitespace-normal py-3 text-left"
                                onClick={() => {
                                    setSelectedServerId(server.id);
                                    setShowServerPicker(false);
                                }}
                            >
                                <Server className="h-5 w-5 shrink-0" aria-hidden="true" />
                                <span className="flex min-w-0 flex-col items-start">
                                    <span className="max-w-full truncate">
                                        {server.name || server.url}
                                    </span>
                                    {server.name && (
                                        <span className="max-w-full truncate text-xs text-muted-foreground">
                                            {server.url}
                                        </span>
                                    )}
                                </span>
                            </FocusableButton>
                        ))}
                    </div>
                </section>
            )}

            {visibleProfiles.length === 0 && (
                <p className="text-center text-muted-foreground">{t('profiles:empty_profiles')}</p>
            )}

            <section aria-label={t('profiles:who_is_watching')}>
                <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4 sm:justify-start">
                    {visibleProfiles.map((profile) => {
                        const isFocused = focusedProfileId === profile.id;
                        const isConfirmingRemoval = pendingRemovalId === profile.id;
                        const canDeleteProfile =
                            profile.requiresAuthentication && activeProfile?.id !== profile.id;
                        const profileServer = serversById.get(profile.serverId);
                        const avatarUrl =
                            profile.avatarUrl ||
                            (profileServer
                                ? getUserProfileImageUrl(profile.jellyfinUserId, profileServer.url)
                                : '');

                        return (
                            <div
                                key={profile.id}
                                className="group/profile flex w-40 flex-col items-center text-center"
                                onFocusCapture={() => setFocusedProfileId(profile.id)}
                                onBlurCapture={(event) => handleProfileBlur(event, profile.id)}
                                onMouseEnter={() => setFocusedProfileId(profile.id)}
                                onMouseLeave={(event) => {
                                    if (!event.currentTarget.contains(document.activeElement)) {
                                        setFocusedProfileId((current) =>
                                            current === profile.id ? null : current
                                        );
                                    }
                                }}
                            >
                                <FocusableButton
                                    variant="ghost"
                                    autoFocus={profile.id === firstProfileId && !showServerPicker}
                                    focusRequest={
                                        profileFocusRequest?.profileId === profile.id
                                            ? profileFocusRequest.token
                                            : undefined
                                    }
                                    className="h-28 w-28 shrink-0 rounded-full p-0 hover:bg-transparent"
                                    aria-label={`${profile.displayName}${profile.requiresAuthentication ? `, ${t('profiles:disconnected')}` : ''}`}
                                    onNavigationFocus={() =>
                                        handleProfileNavigationFocus(profile.id, 'avatar')
                                    }
                                    onNavigationBlur={() =>
                                        handleProfileNavigationBlur(profile.id, 'avatar')
                                    }
                                    onClick={() => void selectProfile(profile)}
                                >
                                    <Avatar className="size-full border-2 border-white/15 shadow-xl">
                                        <AvatarImage
                                            src={avatarUrl}
                                            alt={profile.displayName}
                                            referrerPolicy="no-referrer"
                                        />
                                        <AvatarFallback className="text-2xl">
                                            {profileInitials(profile.displayName) || <UserRound />}
                                        </AvatarFallback>
                                    </Avatar>
                                </FocusableButton>
                                <span className="mt-3 flex w-full flex-col items-center gap-1">
                                    <span className="max-w-full truncate text-lg font-medium">
                                        {profile.displayName}
                                    </span>
                                    {profile.requiresAuthentication && (
                                        <span className="text-xs text-muted-foreground">
                                            {t('profiles:disconnected')}
                                        </span>
                                    )}
                                </span>

                                <div className="mt-2 flex items-center justify-center gap-2">
                                    {isConfirmingRemoval ? (
                                        <>
                                            <FocusableButton
                                                autoFocus
                                                size="sm"
                                                variant="ghost"
                                                className="h-auto min-h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
                                                focusedClassName="border-destructive/40 bg-destructive/20 text-destructive ring-destructive/50"
                                                aria-label={`${t('profiles:delete_profile')} ${profile.displayName}`}
                                                onNavigationFocus={() =>
                                                    handleProfileNavigationFocus(
                                                        profile.id,
                                                        'confirm-delete'
                                                    )
                                                }
                                                onNavigationBlur={() =>
                                                    handleProfileNavigationBlur(
                                                        profile.id,
                                                        'confirm-delete'
                                                    )
                                                }
                                                onClick={() => void confirmRemoval(profile)}
                                            >
                                                <Trash2 aria-hidden="true" />
                                                {t('profiles:delete_profile')}
                                            </FocusableButton>
                                            <FocusableButton
                                                size="sm"
                                                variant="outline"
                                                onNavigationFocus={() =>
                                                    handleProfileNavigationFocus(
                                                        profile.id,
                                                        'cancel-delete'
                                                    )
                                                }
                                                onNavigationBlur={() =>
                                                    handleProfileNavigationBlur(
                                                        profile.id,
                                                        'cancel-delete'
                                                    )
                                                }
                                                onClick={() => setPendingRemovalId(null)}
                                            >
                                                {t('common:cancel')}
                                            </FocusableButton>
                                        </>
                                    ) : (
                                        isFocused &&
                                        (profile.requiresAuthentication ? (
                                            canDeleteProfile ? (
                                                <FocusableButton
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-auto min-h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
                                                    focusedClassName="border-destructive/40 bg-destructive/20 text-destructive ring-destructive/50"
                                                    autoFocus={
                                                        autoFocusDeleteProfileId === profile.id
                                                    }
                                                    aria-label={`${t('profiles:delete_profile')} ${profile.displayName}`}
                                                    title={`${t('profiles:delete_profile')} ${profile.displayName}`}
                                                    onNavigationFocus={() =>
                                                        handleProfileNavigationFocus(
                                                            profile.id,
                                                            'delete'
                                                        )
                                                    }
                                                    onNavigationBlur={() =>
                                                        handleProfileNavigationBlur(
                                                            profile.id,
                                                            'delete'
                                                        )
                                                    }
                                                    onClick={() => setPendingRemovalId(profile.id)}
                                                >
                                                    <Trash2 aria-hidden="true" />
                                                    {t('profiles:delete_profile')}
                                                </FocusableButton>
                                            ) : null
                                        ) : (
                                            <FocusableButton
                                                size="sm"
                                                variant="ghost"
                                                className="h-auto min-h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
                                                focusedClassName="border-destructive/40 bg-destructive/20 text-destructive ring-destructive/50"
                                                onNavigationFocus={() =>
                                                    handleProfileNavigationFocus(
                                                        profile.id,
                                                        'disconnect'
                                                    )
                                                }
                                                onNavigationBlur={() =>
                                                    handleProfileNavigationBlur(
                                                        profile.id,
                                                        'disconnect'
                                                    )
                                                }
                                                aria-label={`${t('profiles:disconnect_profile')} ${profile.displayName}`}
                                                onClick={() => void disconnectProfile(profile)}
                                            >
                                                <LogOut aria-hidden="true" />
                                                {t('profiles:disconnect_profile')}
                                            </FocusableButton>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex w-40 flex-col items-center text-center">
                        <FocusableButton
                            variant="ghost"
                            autoFocus={visibleProfiles.length === 0 && !showServerPicker}
                            className="h-28 w-28 shrink-0 rounded-full p-0 hover:bg-transparent"
                            aria-label={t('profiles:add_profile')}
                            onClick={() => addProfile()}
                        >
                            <span className="inline-flex size-full items-center justify-center rounded-full border-2 border-dashed border-white/25 bg-white/5 text-muted-foreground transition-colors">
                                <Plus className="size-12" aria-hidden="true" />
                            </span>
                        </FocusableButton>
                        <span className="mt-3 text-lg font-medium">
                            {t('profiles:add_profile')}
                        </span>
                    </div>
                </div>
            </section>
        </main>
    );
}
