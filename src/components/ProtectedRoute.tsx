import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#E50914]"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/giris-yap" replace />;
    }

    return <Outlet />;
};
