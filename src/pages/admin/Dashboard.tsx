import { useState, useEffect } from 'react';
import { Users, Zap, Shield, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscriptions: 0,
        bannedUsers: 0,
        recentUsers: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch all profiles via our secure RPC function
                const { data: allProfiles, error: fetchError } = await supabase
                    .rpc('get_all_profiles');

                if (fetchError) throw fetchError;

                const profiles = allProfiles || [];

                // Calculate stats
                const totalCount = profiles.length;
                const bannedCount = profiles.filter((p: any) => p.is_banned).length;
                const activeCount = profiles.filter((p: any) => p.subscription_expiry && new Date(p.subscription_expiry).getTime() > Date.now()).length;

                // Recent users (sort and limit)
                const recent = [...profiles]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5);

                setStats({
                    totalUsers: totalCount || 0,
                    activeSubscriptions: activeCount || 0,
                    bannedUsers: bannedCount || 0,
                    recentUsers: recent || []
                });
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { label: 'TOPLAM KULLANICI', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'AKTİF ABONELİK', value: stats.activeSubscriptions, icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
        { label: 'YASAKLI HESAPLAR', value: stats.bannedUsers, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        { label: 'SİSTEM DURUMU', value: 'AKTİF', icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    ];

    return (
        <div className="max-w-7xl mx-auto animation-fade-in">
            <header className="mb-10 lg:mb-14">
                <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-3 uppercase bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Genel Bakış</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs lg:text-sm">Flixify Sistem İstatistikleri</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((card, i) => (
                    <div
                        key={i}
                        className="bg-surface/50 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-xl group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100`} />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={`p-4 rounded-2xl ${card.bg} ${card.border} border`}>
                                <card.icon size={28} className={`${card.color}`} />
                            </div>
                            <TrendingUp size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-4xl lg:text-5xl font-black mb-2 relative z-10 tracking-tight">{card.value}</div>
                        <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">{card.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Users */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-surface/40 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-xl transition-all hover:bg-surface/60">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Users className="text-primary" size={24} />
                                Son Kayıtlar
                            </h2>
                            <Link to="/webintosh/users" className="text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors border border-primary/20 bg-primary/5">Tümünü Gör</Link>
                        </div>

                        <div className="space-y-3">
                            {loading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : stats.recentUsers.length > 0 ? (
                                stats.recentUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-5 bg-black/40 rounded-2xl hover:bg-white/5 transition-all border border-white/5 hover:border-white/10 group cursor-default">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                                                {user.account_number?.substring(0, 1)}
                                            </div>
                                            <div>
                                                <div className="font-mono text-sm lg:text-base font-bold tracking-wider group-hover:text-primary transition-colors">
                                                    {user.account_number?.replace(/(\d{4})/g, '$1 ').trim()}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                                    {new Date(user.created_at).toLocaleDateString('tr-TR')} • {new Date(user.created_at).toLocaleTimeString('tr-TR')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${user.is_banned ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}>
                                            {user.is_banned ? 'YASAKLI' : 'AKTİF'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-white/5 rounded-2xl">
                                    Henüz kayıtlı kullanıcı yok.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <section className="bg-surface/40 border border-white/5 rounded-3xl p-6 lg:p-8 backdrop-blur-xl h-full flex flex-col">
                        <h2 className="text-xl font-black uppercase tracking-tight mb-8">Hızlı İşlemler</h2>
                        <div className="grid grid-cols-1 gap-4 flex-1">
                            <Link to="/webintosh/users" className="flex items-center gap-5 p-5 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-all group">
                                <div className="p-4 bg-primary rounded-xl text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-black text-white group-hover:text-primary transition-colors">Kullanıcıları Yönet</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">Süre ekle, M3U ata, banla</div>
                                </div>
                            </Link>

                            <Link to="/webintosh/plans" className="flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                                <div className="p-4 bg-surface rounded-xl text-gray-300 group-hover:scale-110 transition-transform border border-white/5">
                                    <Zap size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-black text-white group-hover:text-white transition-colors">Paketleri Düzenle</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">Fiyatlandırma ve süreler</div>
                                </div>
                            </Link>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex gap-4 items-start relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <div className="bg-black/50 p-2.5 rounded-xl text-primary border border-primary/20 shadow-inner">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-white mb-1 tracking-wide text-sm">Sistem Saati & Bakım</h4>
                                    <p className="text-gray-400 text-[10px] leading-relaxed font-bold uppercase tracking-wider">
                                        Otomatik yedeklemeler her gece rutin olarak çalışır.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
