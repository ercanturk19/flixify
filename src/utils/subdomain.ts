export const getSubdomain = () => {
    const hostname = window.location.hostname;
    
    // Localhost handling
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        const parts = hostname.split('.');
        // e.g. admin.localhost -> admin
        if (parts.length > 1 && parts[0] !== 'www') {
            return parts[0];
        }
        return null;
    }

    // Production handling (e.g. admin.flixify.pro)
    const parts = hostname.split('.');
    if (parts.length > 2) {
        return parts[0]; // "admin", "app" etc.
    }
    
    return null; // Root domain (flixify.pro)
};
