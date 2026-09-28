import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from '@/router';
import { useTranslation } from 'react-i18next';
import {
    getJellyfinInstance,
    getSavedProfiles,
    getSavedServers,
    getServerUrl,
    ProfileIdentityMismatchError,
    useDiscoverServers,
    useLogin,
    useQuickConnectAuthenticate,
    useQuickConnectInitiate,
    useQuickConnectStatus,
    useServerAddress,
} from '@pelagica/core';
import { getLocalIpAddress } from '@pelagica/tv-platform';
import FocusableButton from '@/components/FocusableButton';
import FocusableField from '@/components/FocusableField';
import { AlertTriangle, Loader2, Server } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getQuickConnectUrl } from '@/utils/quickConnectUrl';
import { Card, CardContent } from '@/components/ui/card';

type Step = 'server' | 'method' | 'quickconnect' | 'password';

const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center gap-1 text-sm text-destructive">
        <AlertTriangle className="inline-block mr-1 w-4 h-4" />
        <p>{message}</p>
    </div>
);

const Login = () => {
    const { t } = useTranslation(['login', 'common', 'profiles']);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const reauthProfileId = searchParams.get('profileId');
    const reauthProfile = useMemo(
        () =>
            reauthProfileId
                ? (getSavedProfiles().find((profile) => profile.id === reauthProfileId) ?? null)
                : null,
        [reauthProfileId]
    );
    const reauthServerUrl = useMemo(
        () =>
            reauthProfile
                ? (getSavedServers().find((server) => server.id === reauthProfile.serverId)?.url ??
                  null)
                : null,
        [reauthProfile]
    );
    const requestedServerUrl = searchParams.get('server')?.trim() ?? '';
    const predefinedServerAddress = useServerAddress();

    const [serverUrl, setServerUrl] = useState<string>(
        () => reauthServerUrl || requestedServerUrl || getServerUrl() || ''
    );
    const [step, setStep] = useState<Step>(() =>
        reauthProfile
            ? 'password'
            : reauthServerUrl || requestedServerUrl || getServerUrl()
              ? 'method'
              : 'server'
    );
    const [checkingServer, setCheckingServer] = useState(false);
    const [serverCheckError, setServerCheckError] = useState<string | null>(null);

    const discovery = useDiscoverServers();
    const discoveryStartedRef = useRef(false);

    const [username, setUsername] = useState(() => reauthProfile?.username ?? '');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const [loginError, setLoginError] = useState<string | null>(null);

    const quickConnectInitiate = useQuickConnectInitiate();
    const quickConnectAuthenticate = useQuickConnectAuthenticate();
    const [quickConnectSecret, setQuickConnectSecret] = useState<string | undefined>(undefined);
    const [quickConnectCode, setQuickConnectCode] = useState<string | null>(null);
    const [quickConnectError, setQuickConnectError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [quickConnectApproved, setQuickConnectApproved] = useState(false);
    const initiatingRef = useRef(false);

    const quickConnectStatus = useQuickConnectStatus(serverUrl, quickConnectSecret, isPolling);

    useEffect(() => {
        if (reauthProfileId && !reauthProfile) {
            navigate('/profiles', { mode: 'reset' });
        }
    }, [reauthProfileId, reauthProfile, navigate]);

    // A server pre-configured by the deployment means the user never has to
    // type a server address on the TV.
    useEffect(() => {
        if (!predefinedServerAddress?.trim() || serverUrl) return;
        setServerUrl(predefinedServerAddress);
        setStep('method');
    }, [predefinedServerAddress, serverUrl]);

    useEffect(() => {
        if (step !== 'server' || predefinedServerAddress || discoveryStartedRef.current) return;
        discoveryStartedRef.current = true;
        getLocalIpAddress().then((localIp) => discovery.start(localIp));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, predefinedServerAddress]);

    const connectToServer = useCallback(
        async (input: string) => {
            setCheckingServer(true);
            setServerCheckError(null);

            try {
                const servers =
                    await getJellyfinInstance().discovery.getRecommendedServerCandidates(input);
                const best = getJellyfinInstance().discovery.findBestServer(servers);
                if (!best) {
                    setServerCheckError(t('login:could_not_find_server'));
                    return;
                }
                setServerUrl(best.address);
                setStep('method');
            } finally {
                setCheckingServer(false);
            }
        },
        [t]
    );

    const onSubmitServer = useCallback(
        (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const input = String(new FormData(e.currentTarget).get('server') ?? '').trim();
            if (!input) {
                setServerCheckError(t('login:please_enter_server_address'));
                return;
            }
            connectToServer(input);
        },
        [connectToServer, t]
    );

    const initiateQuickConnect = useCallback(async () => {
        setQuickConnectError(null);
        try {
            const result = await quickConnectInitiate.mutateAsync(serverUrl);
            if (result.Code && result.Secret) {
                setQuickConnectCode(result.Code);
                setQuickConnectSecret(result.Secret);
                setIsPolling(true);
            } else {
                setQuickConnectError(t('login:quick_connect_unavailable'));
            }
        } catch {
            setQuickConnectError(t('login:quick_connect_unavailable'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverUrl]);

    useEffect(() => {
        if (step === 'quickconnect' && !quickConnectCode && !initiatingRef.current) {
            initiatingRef.current = true;
            initiateQuickConnect().finally(() => {
                initiatingRef.current = false;
            });
        }
    }, [step, quickConnectCode, initiateQuickConnect]);

    useEffect(() => {
        if (!quickConnectStatus.data?.Authenticated || !quickConnectSecret || quickConnectApproved)
            return;

        setQuickConnectApproved(true);
        setIsPolling(false);

        quickConnectAuthenticate
            .mutateAsync({
                server: serverUrl,
                secret: quickConnectSecret,
                expectedUserId: reauthProfile?.jellyfinUserId,
            })
            .then(() => navigate('/', { mode: 'reset' }))
            .catch((error: unknown) => {
                setQuickConnectError(
                    error instanceof ProfileIdentityMismatchError
                        ? t('login:login_failed')
                        : t('login:quick_connect_auth_failed')
                );
                setQuickConnectApproved(true);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        quickConnectStatus.data,
        quickConnectSecret,
        quickConnectApproved,
        serverUrl,
        quickConnectAuthenticate,
        navigate,
        reauthProfile,
    ]);

    const onSubmitPassword = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setLoginError(null);
            try {
                await login.mutateAsync({
                    server: serverUrl,
                    username:
                        reauthProfile?.username?.trim() || reauthProfile?.displayName || username,
                    password,
                    expectedUserId: reauthProfile?.jellyfinUserId,
                });
                navigate('/', { mode: 'reset' });
            } catch (error) {
                setLoginError(
                    error instanceof ProfileIdentityMismatchError
                        ? t('login:login_failed')
                        : t('login:invalid_credentials')
                );
            }
        },
        [serverUrl, username, password, login, navigate, t, reauthProfile]
    );

    const quickConnectUrl = getQuickConnectUrl(quickConnectCode);

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6">
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-semibold">Littora</h1>
                {reauthProfile && (
                    <p className="text-sm text-muted-foreground">
                        {t('login:login_to_jellyfin')}: {reauthProfile.displayName}
                    </p>
                )}
            </div>

            {step === 'server' && (
                <div className="flex w-full max-w-sm flex-col gap-3">
                    <form onSubmit={onSubmitServer} className="flex flex-col gap-3">
                        <label className="text-sm text-muted-foreground" htmlFor="server">
                            {discovery.servers.length > 0
                                ? t('login:enter_manually')
                                : t('login:server_address')}
                        </label>
                        <FocusableField
                            id="server"
                            name="server"
                            placeholder="jellyfin.example.com"
                            autoFocus={discovery.servers.length === 0 && !discovery.isScanning}
                        />
                        {serverCheckError && <ErrorMessage message={serverCheckError} />}
                        <FocusableButton className="w-full" type="submit" disabled={checkingServer}>
                            {checkingServer ? t('login:connecting') : t('login:connect')}
                        </FocusableButton>
                    </form>

                    {(discovery.isScanning || discovery.servers.length > 0) && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {t('login:discovered_servers')}
                                </span>
                                {discovery.isScanning && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {t('login:scanning_network')}
                                    </span>
                                )}
                            </div>
                            {discovery.servers.map((server, index) => (
                                <FocusableButton
                                    key={server.id ?? server.address}
                                    variant="outline"
                                    className="w-full justify-start"
                                    autoFocus={index === 0}
                                    disabled={checkingServer}
                                    onClick={() => connectToServer(server.address)}
                                >
                                    <Server className="h-4 w-4 shrink-0" />
                                    <span className="flex items-center justify-between w-full overflow-hidden">
                                        <span className="truncate">{server.name}</span>
                                        <span className="truncate text-[0.625rem]! text-muted-foreground">
                                            {server.address}
                                        </span>
                                    </span>
                                </FocusableButton>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 'method' && (
                <div className="flex w-full max-w-sm flex-col gap-3">
                    <FocusableButton
                        autoFocus
                        className="w-full"
                        onClick={() => setStep('quickconnect')}
                    >
                        {t('login:sign_in_with_quick_connect')}
                    </FocusableButton>
                    <FocusableButton
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep('password')}
                    >
                        {t('login:sign_in_with_password')}
                    </FocusableButton>
                    {!predefinedServerAddress && !reauthProfile && (
                        <FocusableButton
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                                setStep('server');
                                setServerCheckError(null);
                            }}
                        >
                            {t('login:use_different_server')}
                        </FocusableButton>
                    )}
                </div>
            )}

            {step === 'quickconnect' && (
                <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
                    {quickConnectUrl && (
                        <Card className="py-2">
                            <CardContent className="px-2">
                                <div className="flex items-center justify-center bg-white p-2 rounded-md">
                                    <QRCode value={quickConnectUrl} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <p className="text-4xl font-semibold tracking-[0.3em]">
                        {quickConnectCode ?? '……'}
                    </p>
                    <p className="text-muted-foreground text-xs">
                        {t('login:quick_connect_qr_instructions', { server: serverUrl })}
                    </p>
                    {quickConnectError && <ErrorMessage message={quickConnectError} />}
                    <FocusableButton
                        autoFocus
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                            setIsPolling(false);
                            setQuickConnectCode(null);
                            setQuickConnectSecret(undefined);
                            setQuickConnectError(null);
                            setQuickConnectApproved(false);
                            setStep('method');
                        }}
                    >
                        {t('common:back')}
                    </FocusableButton>
                </div>
            )}

            {step === 'password' && (
                <form onSubmit={onSubmitPassword} className="flex w-full max-w-sm flex-col gap-3">
                    {!reauthProfile && (
                        <>
                            <label className="text-sm text-muted-foreground" htmlFor="username">
                                {t('login:username')}
                            </label>
                            <FocusableField
                                id="username"
                                placeholder={t('login:username')}
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </>
                    )}
                    <label className="text-sm text-muted-foreground" htmlFor="password">
                        {t('login:password')}
                    </label>
                    <FocusableField
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {loginError && <ErrorMessage message={loginError} />}
                    <FocusableButton className="w-full" type="submit" disabled={login.isPending}>
                        {login.isPending ? t('login:logging_in') : t('login:login')}
                    </FocusableButton>
                    {!reauthProfile && (
                        <FocusableButton
                            variant="ghost"
                            className="w-full"
                            onClick={() => setStep('method')}
                        >
                            {t('common:back')}
                        </FocusableButton>
                    )}
                </form>
            )}

            <FocusableButton
                variant="ghost"
                className="w-full max-w-sm"
                onClick={() => navigate(-1)}
            >
                {t('profiles:back_to_profiles')}
            </FocusableButton>
        </div>
    );
};

export default Login;
