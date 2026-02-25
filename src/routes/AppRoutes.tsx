import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useMemo } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// Lazy load all page components for better initial load performance
const LandingPage = lazy(() => import('../components/LandingPage').then(m => ({ default: m.LandingPage })));
const HomePage = lazy(() => import('../components/HomePage').then(m => ({ default: m.HomePage })));
const LiveTVPage = lazy(() => import('../components/LiveTVPage').then(m => ({ default: m.LiveTVPage })));
const MoviesPage = lazy(() => import('../components/MoviesPage').then(m => ({ default: m.MoviesPage })));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Profile = lazy(() => import('../pages/Profile'));

// Lightweight loading fallback
function PageLoader() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

function IndexPage() {
    const { user } = useAuth();
    
    // Memoize to prevent unnecessary re-renders
    return useMemo(() => {
        if (user) {
            return (
                <Suspense fallback={<PageLoader />}>
                    <HomePage />
                </Suspense>
            );
        }
        return (
            <Suspense fallback={<PageLoader />}>
                <LandingPage />
            </Suspense>
        );
    }, [user]);
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/giris-yap" element={
                <Suspense fallback={<PageLoader />}>
                    <Login />
                </Suspense>
            } />
            <Route path="/kayit-ol" element={
                <Suspense fallback={<PageLoader />}>
                    <Register />
                </Suspense>
            } />
            
            {/* Dynamic home page */}
            <Route path="/" element={<IndexPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/canli-tv" element={
                    <Suspense fallback={<PageLoader />}>
                        <LiveTVPage />
                    </Suspense>
                } />
                <Route path="/filmler" element={
                    <Suspense fallback={<PageLoader />}>
                        <MoviesPage />
                    </Suspense>
                } />
                <Route path="/profil" element={
                    <Suspense fallback={<PageLoader />}>
                        <Profile />
                    </Suspense>
                } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
