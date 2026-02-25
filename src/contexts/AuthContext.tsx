import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
    id: string;
    account_number: string;
    subscription_expiry: string | null;
    m3u_url: string | null;
    is_banned: boolean;
    is_admin: boolean;
    created_at: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

// Cache profile data to avoid repeated fetches
const profileCache = new Map<string, { profile: Profile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const isFetchingRef = useRef(false);

    const fetchProfile = useCallback(async (userId: string, forceRefresh = false) => {
        // Prevent concurrent fetches
        if (isFetchingRef.current && !forceRefresh) return;
        isFetchingRef.current = true;

        try {
            // Check cache first
            const cached = profileCache.get(userId);
            if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log('[AUTH] Using cached profile');
                setProfile(cached.profile);
                setLoading(false);
                isFetchingRef.current = false;
                return;
            }

            console.log('[AUTH] Fetching profile for userId:', userId);
            
            // Shorter timeout - 4 seconds is plenty for a simple query
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Profile fetch timeout')), 4000);
            });

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                console.error('[AUTH] Profile fetch error:', error);
                setProfile(null);
            } else {
                console.log('[AUTH] Profile fetched successfully');
                setProfile(data);
                // Update cache
                profileCache.set(userId, { profile: data, timestamp: Date.now() });
            }
        } catch (err) {
            console.error('[AUTH] Unexpected error fetching profile:', err);
            setProfile(null);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user?.id) {
            await fetchProfile(user.id, true);
        }
    }, [user?.id, fetchProfile]);

    useEffect(() => {
        let mounted = true;

        // Initial session check
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (!mounted) return;
            
            if (error) {
                console.error('[AUTH] Session error:', error);
                setLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        }).catch((err) => {
            if (!mounted) return;
            console.error('[AUTH] Session fetch error:', err);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const signOut = useCallback(async () => {
        // Clear cache on sign out
        if (user?.id) {
            profileCache.delete(user.id);
        }
        await supabase.auth.signOut();
    }, [user?.id]);

    // Memoized context value to prevent unnecessary re-renders
    const value = React.useMemo(() => ({
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
    }), [session, user, profile, loading, signOut, refreshProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Optimized hook with selector support
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Selector hooks for granular updates
export const useUser = () => useAuth().user;
export const useProfile = () => useAuth().profile;
export const useIsLoading = () => useAuth().loading;
export const useSignOut = () => useAuth().signOut;

export default AuthContext;
