import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Tv, UserPlus, AlertCircle } from 'lucide-react';

const AdminRegister: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { session } = useAuth();

    if (session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">Zaten giriş yapmışsınız.</h2>
                    <Link to="/" className="text-primary hover:underline">Panele Git</Link>
                </div>
            </div>
        );
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            setLoading(false);
            return;
        }

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
            } else {
                setSuccess('Hesap başarıyla oluşturuldu! Şimdi bu hesabı veritabanından yetkilendirmeniz gerekiyor.');
                // Optional: Auto-login is handled by Supabase, but we might want to show the success message first.
                // navigate('/giris-yap'); 
            }
        } catch (err) {
            setError('Kayıt sırasında beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <div className="flex items-center justify-center gap-2 text-primary mb-4">
                    <Tv size={32} />
                    <span className="text-2xl font-bold">FLIXIFY ADMIN</span>
                </div>
                <h2 className="text-xl font-bold">Admin Hesabı Oluştur</h2>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md bg-zinc-900 p-8 rounded-lg border border-zinc-800">
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded mb-6 text-sm">
                        <p className="font-bold flex items-center gap-2 mb-2">
                            <UserPlus size={16} />
                            {success}
                        </p>
                        <p className="mb-2">
                            Güvenlik gereği, yeni açılan hesaplar otomatik olarak yönetici yetkisine sahip <strong>OLMAZ</strong>.
                        </p>
                        <p>
                            Lütfen Supabase SQL Editörünü açın ve şu komutu çalıştırın:
                        </p>
                        <div className="bg-black p-2 rounded border border-green-700/50 font-mono text-xs mt-2 select-all text-green-400">
                            update profiles<br/>
                            set is_admin = true<br/>
                            from auth.users<br/>
                            where profiles.id = auth.users.id<br/>
                            and auth.users.email = '{email}';
                        </div>
                        <div className="mt-4 text-center">
                            <Link to="/giris-yap" className="text-white underline hover:text-primary">
                                Giriş Ekranına Dön
                            </Link>
                        </div>
                    </div>
                )}

                {!success && (
                    <form className="space-y-6" onSubmit={handleRegister}>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">E-posta</label>
                            <div className="mt-1 relative">
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black border border-zinc-700 rounded p-2.5 pl-10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@flixify.pro"
                                />
                                <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400">Şifre</label>
                            <div className="mt-1 relative">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black border border-zinc-700 rounded p-2.5 pl-10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400">Şifre Tekrar</label>
                            <div className="mt-1 relative">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black border border-zinc-700 rounded p-2.5 pl-10 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-red-700 text-white font-bold py-2.5 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'İşleniyor...' : (
                                <>
                                    <UserPlus size={18} />
                                    Hesabı Oluştur
                                </>
                            )}
                        </button>
                    </form>
                )}
                
                {!success && (
                    <div className="mt-6 text-center text-sm">
                        <Link to="/giris-yap" className="text-gray-500 hover:text-white transition-colors">
                            Zaten hesabınız var mı? Giriş yapın
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRegister;
