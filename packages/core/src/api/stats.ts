import { withBasePath } from '../utils/basePath';
import { getPlatform } from './jellyfinClient';

export type StatsConsent = 'granted' | 'denied' | 'unknown';

const LOCAL_STATS_CONSENT_KEY = 'pelagica_stats_consent';

const isTvPlatform = () => {
    const platform = getPlatform();
    return platform === 'tizen' || platform === 'webos';
};

const numberToStatsConsent = (value: number): StatsConsent => {
    switch (value) {
        case 2:
            return 'denied';
        case 1:
            return 'unknown';
        case 0:
            return 'granted';
        default:
            throw new Error(`Invalid stats consent value: ${value}`);
    }
};

const setLocalStatsConsent = (consent: boolean): void => {
    localStorage.setItem(LOCAL_STATS_CONSENT_KEY, consent ? 'granted' : 'denied');
};

export const getStatsConsent = async (): Promise<StatsConsent> => {
    if (isTvPlatform()) {
        // Littora's TV clients do not collect or send usage statistics.
        setLocalStatsConsent(false);
        return 'denied';
    }

    const res = await fetch(withBasePath('/api/stats-consent'));
    if (!res.ok) {
        throw new Error('Failed to fetch stats consent');
    }
    const data = await res.json();
    return numberToStatsConsent(data.consent);
};

export const setStatsConsent = async (consent: boolean): Promise<void> => {
    if (isTvPlatform()) {
        setLocalStatsConsent(false);
        return;
    }

    const res = await fetch(withBasePath('/api/stats-consent?consent=' + consent), {
        method: 'POST',
    });
    if (!res.ok) {
        throw new Error('Failed to set stats consent');
    }
};
