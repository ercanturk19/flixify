import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tv } from 'lucide-react';

const Login: React.FC = () => {
    const [accountNumber, setAccountNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { session } = useAuth();

    if (session) {
        navigate('/');
        return null;
    }

    const formatInput = (val: string) => {
        const raw = val.replace(/\D/g, '').slice(0, 16);
        return raw.replace(/(.{4})/g, '$1 ').trim();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAccountNumber(formatInput(e.target.value));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawNumber = accountNumber.replace(/\s/g, '');
        if (rawNumber.length !== 16) {
            setError('Hesap numarası 16 haneli olmalıdır.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const fakeEmail = `${rawNumber}@anon.flixify.com`;
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password: rawNumber,
            });

            if (signInError) {
                setError('Geçersiz hesap numarası. Lütfen kontrol edip tekrar deneyin.');
            } else {
                if (window.location.protocol === 'https:') {
                    const { data: { session } } = await supabase.auth.getSession();
                    const accessToken = session?.access_token;
                    const refreshToken = session?.refresh_token;
                    window.location.href = `http://app.flixify.pro/#access_token=${accessToken}&refresh_token=${refreshToken}`;
                    return;
                }
                navigate('/');
            }
        } catch (err) {
            setError('Giriş sırasında beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const heroBg = 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=3540&auto=format&fit=crop';

    return (
        <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background selection:bg-primary/30">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/60 to-transparent z-10" />
                <img src={heroBg} alt="Hero Background" className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
            </div>

            <div className="absolute top-6 left-6 md:left-12 z-20">
                <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                    <Tv size={32} className="text-primary" />
                    <span className="text-2xl font-bold text-white tracking-tight">
                        FLIXIFY <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded ml-1 align-top tracking-normal font-bold">PRO</span>
                    </span>
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-20 px-4 mt-8">
                <div className="bg-surface/90 py-10 px-8 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl sm:px-10 text-left">
                    <h2 className="text-gray-400 text-sm font-black mb-1 uppercase tracking-wide">Oturum Aç</h2>
                    <h3 className="text-white text-2xl font-black mb-4 uppercase tracking-wide">Hesap Numaranızı Girin</h3>

                    <p className="text-gray-400 text-xs sm:text-sm mb-8 font-bold leading-relaxed">
                        Hesap numaranız, hizmetimizi kullanabilmeniz için gereken tek tanımlayıcıdır. Güvenlik ve gizlilik nedeniyle giriş yaptıktan sonra bu bilgiyi tekrar gösteremiyoruz.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded mb-6 text-red-400 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="accountNumber" className="block text-sm font-bold text-gray-300 mb-2">
                                Hesap numarası
                            </label>
                            <input
                                id="accountNumber"
                                name="accountNumber"
                                type="text"
                                required
                                className="w-full px-4 text-white font-mono font-bold tracking-widest text-lg sm:text-xl py-3 bg-background border border-white/20 rounded focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-colors"
                                placeholder="0000 0000 0000 0000"
                                value={accountNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || accountNumber.replace(/\s/g, '').length !== 16}
                                className="w-full flex justify-center py-4 px-4 shadow-lg text-sm font-black text-white bg-primary hover:bg-primary-hover transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed rounded"
                            >
                                {loading ? 'BAĞLANILIYOR...' : 'OTURUM AÇ'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-gray-400 text-sm font-medium">
                        <p>
                            Flixify'da yeni misiniz?{' '}
                            <Link to="/kayit-ol" className="font-bold text-white border-b-2 border-primary hover:text-primary transition-colors pb-0.5">
                                HESAP OLUŞTURUN
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
