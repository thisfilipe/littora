import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import type { Dispatch, ReactNode } from 'react';
import {
    getActiveProfile,
    leaveSession,
    resetAuthRedirectHandler,
    setAuthRedirectHandler,
} from '@pelagica/core';
import { getNavigationAdapter, onBackKey } from '@pelagica/tv-platform';
import { routes } from './routes';
import { matchRoute, parsePath } from './match';
import type { Layer, StackAction, StackState } from './types';

let layerIdCounter = 0;
const nextLayerId = () => `layer-${++layerIdCounter}`;
const SESSION_ROUTES = new Set(['/profiles', '/login']);

export function buildLayer(to: string): Layer {
    const { pathname, search } = parsePath(to);
    const matched = matchRoute(routes, pathname) ?? matchRoute(routes, '/')!;
    return { id: nextLayerId(), pathname, search, route: matched.route, params: matched.params };
}

function reducer(state: StackState, action: StackAction): StackState {
    switch (action.type) {
        case 'PUSH':
            return { layers: [...state.layers, action.layer] };
        case 'REPLACE':
            return { layers: [...state.layers.slice(0, -1), action.layer] };
        case 'POP':
            return state.layers.length > 1 ? { layers: state.layers.slice(0, -1) } : state;
        case 'RESET': {
            const root = state.layers[0];
            const { pathname, search } = parsePath(action.to);
            if (root && root.pathname === pathname && root.search === search) {
                return { layers: [root] };
            }
            return { layers: [buildLayer(action.to)] };
        }
    }
}

const StackStateContext = createContext<StackState | null>(null);
const StackDispatchContext = createContext<Dispatch<StackAction> | null>(null);

/** Lets the active layer intercept the hardware back key e.g. for dismisisng the player UI */
export const BackKeyInterceptContext = createContext<(handler: (() => boolean) | null) => void>(
    () => {}
);

export function LayerStackProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, undefined, () => {
        // A saved profile is never left active across app launches. The picker
        // is the root route so a household member must choose who is watching.
        leaveSession();
        return { layers: [buildLayer('/profiles')] };
    });

    useEffect(() => {
        setAuthRedirectHandler(() => dispatch({ type: 'RESET', to: '/profiles' }));
        return resetAuthRedirectHandler;
    }, [dispatch]);

    console.debug('Layers:', state.layers.map((layer) => layer.pathname).join(' -> '));

    const topLayer = state.layers[state.layers.length - 1];
    const topPath = topLayer?.pathname;

    useEffect(() => {
        if (topPath && !SESSION_ROUTES.has(topPath) && !getActiveProfile()) {
            dispatch({ type: 'RESET', to: '/profiles' });
        }
    }, [topPath, dispatch]);

    const interceptRef = useRef<(() => boolean) | null>(null);
    const setIntercept = useCallback((handler: (() => boolean) | null) => {
        interceptRef.current = handler;
    }, []);

    useEffect(() => {
        return onBackKey(() => {
            if (interceptRef.current?.()) return;

            const activeProfile = getActiveProfile();
            const currentPath = state.layers[state.layers.length - 1]?.pathname;
            if (!activeProfile) {
                if (currentPath === '/login' && state.layers.length > 1) {
                    const previousPath = state.layers[state.layers.length - 2]?.pathname;
                    if (previousPath === '/profiles') {
                        dispatch({ type: 'POP' });
                    } else {
                        dispatch({ type: 'RESET', to: '/profiles' });
                    }
                } else if (currentPath === '/profiles') {
                    // Never pop from the picker into a protected screen without a session.
                    if (state.layers.length > 1) {
                        dispatch({ type: 'RESET', to: '/profiles' });
                    } else {
                        getNavigationAdapter().exitApp();
                    }
                } else {
                    dispatch({ type: 'RESET', to: '/profiles' });
                }
                return;
            }

            if (state.layers.length === 1) {
                getNavigationAdapter().exitApp();
            } else {
                dispatch({ type: 'POP' });
            }
        });
    }, [state.layers, dispatch]);

    return (
        <StackStateContext.Provider value={state}>
            <StackDispatchContext.Provider value={dispatch}>
                <BackKeyInterceptContext.Provider value={setIntercept}>
                    {children}
                </BackKeyInterceptContext.Provider>
            </StackDispatchContext.Provider>
        </StackStateContext.Provider>
    );
}

export function useStackState() {
    const ctx = useContext(StackStateContext);
    if (!ctx) throw new Error('useStackState must be used within a LayerStackProvider');
    return ctx;
}

export function useStackDispatch() {
    const ctx = useContext(StackDispatchContext);
    if (!ctx) throw new Error('useStackDispatch must be used within a LayerStackProvider');
    return ctx;
}
