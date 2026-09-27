import { getActiveProfile, useConfig } from '@pelagica/core';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { House, Library, Search, Settings } from 'lucide-react';
import FocusableNavLink from './FocusableNavLink';
import { FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useLayerFocusable } from '@/router/useLayerFocusable';
import { useLayerId } from '@/router/hooks';
import { topBarFocusKey, type TopBarItem } from '@/router/types';

export type { TopBarItem };

const TopBar = ({ activeItem }: { activeItem?: TopBarItem }) => {
    const { t } = useTranslation(['sidebar', 'common', 'settings', 'profiles']);
    const { config } = useConfig();
    const layerId = useLayerId();
    const activeProfile = getActiveProfile();
    const profileName = activeProfile?.displayName ?? t('profiles:switch_profile');
    const profileInitials = profileName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();

    const { ref, focusKey } = useLayerFocusable<object, HTMLDivElement>({
        focusable: true,
    });

    const logoSrc = config?.logoDarkUrl || 'logo.svg';

    return (
        <header className="relative z-50 w-full h-17 flex items-center justify-center">
            <div className="pointer-events-none absolute inset-0 -bottom-5 bg-linear-to-b from-background/70 to-transparent" />

            <FocusContext.Provider value={focusKey}>
                <div
                    ref={ref}
                    className={
                        'pointer-events-auto relative flex h-11 items-center px-2 sm:px-4 mx-3 w-full md:w-auto rounded-full transition-all duration-300 border justify-between md:justify-start gap-1 md:gap-2 border-white/10 bg-background/55'
                    }
                >
                    <div className="flex items-center gap-1 md:gap-2">
                        {/* Logo */}
                        {config?.showLogoInTopBar !== false && (
                            <Avatar className="h-6 w-6 p-0.5 rounded-md">
                                <AvatarImage src={logoSrc} alt="logo" />
                                <AvatarFallback className="rounded-md text-xs">PE</AvatarFallback>
                            </Avatar>
                        )}

                        {/* Desktop nav */}
                        <nav className="hidden md:flex items-center gap-0.5">
                            <FocusableNavLink
                                to="/"
                                focusKey={topBarFocusKey('home', layerId)}
                                active={activeItem === 'home'}
                            >
                                <House className="h-4 w-4" />
                                {t('sidebar:home')}
                            </FocusableNavLink>

                            <FocusableNavLink
                                to="/library"
                                focusKey={topBarFocusKey('library', layerId)}
                                active={activeItem === 'library'}
                            >
                                <Library className="h-4 w-4" />
                                {t('sidebar:library')}
                            </FocusableNavLink>

                            <FocusableNavLink
                                to="/search"
                                focusKey={topBarFocusKey('search', layerId)}
                                active={activeItem === 'search'}
                            >
                                <Search className="h-4 w-4" />
                                {t('common:search')}
                            </FocusableNavLink>

                            <FocusableNavLink
                                to="/settings"
                                focusKey={topBarFocusKey('settings', layerId)}
                                active={activeItem === 'settings'}
                            >
                                <Settings className="h-4 w-4" />
                                {t('settings:title')}
                            </FocusableNavLink>
                        </nav>
                    </div>

                    <FocusableNavLink
                        to="/profiles"
                        focusKey={topBarFocusKey('profiles', layerId)}
                        active={activeItem === 'profiles'}
                        className="max-w-48"
                    >
                        <Avatar size="sm" className="rounded-md">
                            <AvatarImage
                                src={activeProfile?.avatarUrl}
                                alt={profileName}
                            />
                            <AvatarFallback className="rounded-md text-[0.6rem]">
                                {profileInitials || '??'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="max-w-32 truncate">{profileName}</span>
                    </FocusableNavLink>
                </div>
            </FocusContext.Provider>
        </header>
    );
};

export default TopBar;
