import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminRoute: React.FC = () => {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/giris-yap" replace />;
    }

    if (!profile?.is_admin) {
        console.log('AdminRoute: Access Denied', {
            hasSession: !!session,
            user: session?.user?.id,
            isAdmin: profile?.is_admin,
            profileData: profile
        });
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="bg-surface/90 p-8 rounded-2xl border border-red-500/20 text-center max-w-md shadow-2xl backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                    </div>
                    <h2 className="text-red-500 text-xl font-bold mb-4 uppercase tracking-wider">Yetkisiz Erişim</h2>
                    <p className="text-gray-300 mb-6 font-medium text-sm leading-relaxed">
                        Admin paneline erişim yetkiniz bulunmuyor. Bu alanı görüntülemek için <strong className="text-white">Supabase</strong> veritabanınıza gidin, <strong className="text-primary">profiles</strong> tablosunu açın ve kendi hesabınızın <strong className="text-primary">is_admin</strong> (veya yetkili) sütununu <strong className="text-white">TRUE</strong> olarak kaydedin.
                    </p>
                    <button
                        onClick={() => window.location.href = 'https://flixify.pro'}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded font-black transition-all uppercase tracking-wider text-sm shadow-lg w-full"
                    >
                        Uygulamaya Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    if (profile.is_banned) {
        console.log('AdminRoute: User is Banned');
        return <Navigate to="/" replace />;
    }

    return <AdminLayout />;
};
