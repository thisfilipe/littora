import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    activateProfile,
    getActiveProfile,
    getLastUsedProfileId,
    getSavedProfiles,
    getSavedServers,
    logout,
    removeSavedProfile,
    saveServerUrl,
} from '@pelagica/core';
import type { SavedProfile, SavedServer } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { LogOut, Plus, Trash2, UserRound } from 'lucide-react';
import { useNavigate } from '@/router';
import FocusableButton from '@/components/FocusableButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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
    const { t } = useTranslation(['profiles', 'common', 'login', 'sidebar']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [profiles, setProfiles] = useState<SavedProfile[]>(() => getSavedProfiles());
    const [servers, setServers] = useState<SavedServer[]>(() => getSavedServers());
    const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
    const activeProfile = getActiveProfile();
    const lastUsedProfileId = getLastUsedProfileId();

    const serversById = useMemo(
        () => new Map(servers.map((server) => [server.id, server])),
        [servers]
    );
    const firstProfileId = profiles.some((profile) => profile.id === lastUsedProfileId)
        ? lastUsedProfileId
        : profiles[0]?.id;

    const refreshSavedData = () => {
        setProfiles(getSavedProfiles());
        setServers(getSavedServers());
    };

    const endCurrentSession = async () => {
        await queryClient.cancelQueries();
        if (getActiveProfile()) {
            try {
                await logout(queryClient);
            } catch {
                // Logout clears local session and query state even if the server is unavailable.
            }
        }
        queryClient.clear();
    };

    const addProfile = async (server?: SavedServer) => {
        await endCurrentSession();
        saveServerUrl(server?.url ?? '');
        navigate('/login', { mode: 'reset' });
    };

    const selectProfile = async (profile: SavedProfile) => {
        const server = serversById.get(profile.serverId);
        if (!server) {
            toast.add({ title: t('login:could_not_find_server'), type: 'error' });
            return;
        }

        await endCurrentSession();
        saveServerUrl(server.url);

        if (profile.requiresAuthentication) {
            navigate(`/login?profileId=${encodeURIComponent(profile.id)}`, { mode: 'reset' });
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

    const signOut = async () => {
        await endCurrentSession();
        refreshSavedData();
    };

    const confirmRemoval = async (profile: SavedProfile) => {
        if (getActiveProfile()?.id === profile.id) await endCurrentSession();
        removeSavedProfile(profile.id);
        setPendingRemovalId(null);
        refreshSavedData();
    };

    return (
        <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 p-6 md:p-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <UserRound className="h-8 w-8 text-primary" aria-hidden="true" />
                    <h1 className="text-3xl font-semibold">{t('profiles:who_is_watching')}</h1>
                </div>
                {activeProfile && (
                    <FocusableButton variant="outline" onClick={() => void signOut()}>
                        <LogOut />
                        {t('sidebar:logout')}
                    </FocusableButton>
                )}
            </header>

            {profiles.length > 0 ? (
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {profiles.map((profile) => {
                        const server = serversById.get(profile.serverId);
                        const isConfirmingRemoval = pendingRemovalId === profile.id;

                        return (
                            <Card key={profile.id} className="min-w-0">
                                <CardContent className="flex h-full flex-col gap-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar size="lg" className="rounded-xl">
                                            <AvatarImage
                                                src={profile.avatarUrl}
                                                alt={profile.displayName}
                                            />
                                            <AvatarFallback className="rounded-xl">
                                                {profileInitials(profile.displayName) || <UserRound />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-lg font-medium">
                                                {profile.displayName}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {server?.name || server?.url || profile.serverId}
                                            </span>
                                            {profile.requiresAuthentication && (
                                                <span className="text-xs text-destructive">
                                                    {t('login:login_to_jellyfin')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isConfirmingRemoval ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="mr-auto text-sm">
                                                {t('common:delete')} {profile.displayName}?
                                            </span>
                                            <FocusableButton
                                                autoFocus
                                                variant="destructive"
                                                onClick={() => void confirmRemoval(profile)}
                                            >
                                                {t('common:delete')}
                                            </FocusableButton>
                                            <FocusableButton
                                                variant="outline"
                                                onClick={() => setPendingRemovalId(null)}
                                            >
                                                {t('common:cancel')}
                                            </FocusableButton>
                                        </div>
                                    ) : (
                                        <div className="mt-auto flex flex-wrap gap-2">
                                            <FocusableButton
                                                autoFocus={profile.id === firstProfileId}
                                                onClick={() => void selectProfile(profile)}
                                            >
                                                {profile.requiresAuthentication
                                                    ? t('login:login')
                                                    : t('profiles:switch_profile')}
                                            </FocusableButton>
                                            <FocusableButton
                                                variant="outline"
                                                onClick={() => setPendingRemovalId(profile.id)}
                                            >
                                                <Trash2 />
                                                {t('common:delete')}
                                            </FocusableButton>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>
            ) : (
                <Card>
                    <CardContent className="flex items-center gap-3 text-muted-foreground">
                        <UserRound className="h-6 w-6 shrink-0" aria-hidden="true" />
                        <p>{t('login:connect_to_jellyfin')}</p>
                    </CardContent>
                </Card>
            )}

            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-medium">{t('profiles:add_profile')}</h2>
                {servers.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {servers.map((server, index) => (
                            <FocusableButton
                                key={server.id}
                                autoFocus={profiles.length === 0 && index === 0}
                                variant="outline"
                                className="min-h-12 justify-start whitespace-normal"
                                onClick={() => void addProfile(server)}
                            >
                                <Plus />
                                <span className="flex min-w-0 flex-col items-start">
                                    <span>{t('profiles:add_profile')}</span>
                                    <span className="max-w-full truncate text-xs text-muted-foreground">
                                        {server.name || server.url}
                                    </span>
                                </span>
                            </FocusableButton>
                        ))}
                    </div>
                ) : (
                    <FocusableButton
                        autoFocus={profiles.length === 0}
                        variant="outline"
                        className="w-fit"
                        onClick={() => void addProfile()}
                    >
                        <Plus />
                        {t('profiles:add_profile')}
                    </FocusableButton>
                )}
            </section>
        </main>
    );
}
