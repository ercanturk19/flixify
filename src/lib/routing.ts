/**
 * Smart Routing Utility for HTTP/HTTPS hybrid architecture
 */

export const ROUTES = {
    LANDING: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    PROFILE: '/profil',
    MOVIES: '/filmler',
    SERIES: '/diziler',
    LIVE_TV: '/canli-tv',
    SEARCH: '/search',
    FAVORITES: '/favoriler'
} as const;

export type RouteKey = keyof typeof ROUTES;

export const HTTPS_ROUTES: RouteKey[] = ['LOGIN', 'REGISTER', 'PROFILE'];
export const HTTP_ROUTES: RouteKey[] = ['LANDING', 'MOVIES', 'SERIES', 'LIVE_TV', 'SEARCH', 'FAVORITES'];

export function getSmartUrl(routeKey: RouteKey): string {
    const route = ROUTES[routeKey];
    const isHttps = window.location.protocol === 'https:';
    
    const needsHttp = HTTP_ROUTES.includes(routeKey);
    const needsHttps = HTTPS_ROUTES.includes(routeKey);
    
    if (isHttps && needsHttp) {
        return `http://app.flixify.pro${route}`;
    }
    
    if (!isHttps && needsHttps) {
        return `https://flixify.pro${route}`;
    }
    
    return route;
}

export function navigateSmart(routeKey: RouteKey) {
    const url = getSmartUrl(routeKey);
    if (url.startsWith('http://') || url.startsWith('https://')) {
        window.location.href = url;
    } else {
        window.location.pathname = url;
    }
}

export function isSecureRoute(pathname: string): boolean {
    return HTTPS_ROUTES.some(key => ROUTES[key] === pathname);
}

export function isVideoRoute(pathname: string): boolean {
    return HTTP_ROUTES.some(key => ROUTES[key] === pathname);
}
