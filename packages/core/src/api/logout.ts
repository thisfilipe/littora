import { markActiveProfileRequiresAuthentication } from '../profiles/profileStore';
import { getApi } from './getApi';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import type { QueryClient } from '@tanstack/react-query';
import { logoutFromSeerr } from './seerr/logout';

export async function logout(queryClient: QueryClient) {
    try {
        const sessionApi = getSessionApi(getApi());
        await sessionApi.reportSessionEnded();
    } finally {
        await logoutFromSeerr();
        // Explicit sign-out keeps the profile tile, but asks for credentials next time.
        markActiveProfileRequiresAuthentication();
        queryClient.removeQueries();
    }
}
