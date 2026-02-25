import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Clock, CreditCard, User, Settings, Smartphone, Receipt, Copy, ExternalLink, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';

interface PricingPlan {
    id: string;
    months: number;
    price: string;
    description: string;
    popular?: boolean;
}

const plans: PricingPlan[] = [
    { id: '1-month', months: 1, price: '₺149', description: '30 Gün Boyunca Kesintisiz Erişim' },
    { id: '3-months', months: 3, price: '₺399', description: '90 Gün Boyunca Kesintisiz Erişim', popular: true },
    { id: '12-months', months: 12, price: '₺1299', description: '365 Gün Boyunca Kesintisiz Erişim' },
];

export default function Profile() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [accountNumber, setAccountNumber] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('account');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['account', 'plans', 'devices', 'billing', 'settings'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        if (user?.user_metadata?.raw_account_number) {
            setAccountNumber(user.user_metadata.raw_account_number);
        } else if (user?.email) {
            // Fallback: extract number from email if metadata is missing
            const match = user.email.match(/^(\d+)@/);
            if (match) setAccountNumber(match[1]);
        }
    }, [user]);

    const handleCopy = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(accountNumber).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = accountNumber;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const sidebarItems = [
        { id: 'account', label: 'Hesap Yönetimi', icon: User },
        { id: 'plans', label: 'Paketler & Süre Ekle', icon: Zap },
        { id: 'devices', label: 'Cihazlar', icon: Smartphone },
        { id: 'billing', label: 'Ödemeler & Makbuzlar', icon: Receipt },
        { id: 'settings', label: 'Ayarlar', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
            <Header />

            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-28 pb-20">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="flex flex-col gap-1">
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id
                                        ? 'bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon size={20} className={activeTab === item.id ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'} />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 max-w-4xl">
                        {activeTab === 'account' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <header className="mb-10">
                                    <h1 className="text-4xl font-black tracking-tight mb-2">HESAP</h1>
                                    <div className="flex items-center gap-2 text-primary font-bold">
                                        <Clock size={16} />
                                        <span className="text-sm uppercase tracking-widest">Şu tarihe kadar ödendi: SÜRE SONA ERDİ</span>
                                    </div>
                                </header>

                                <div className="space-y-8">
                                    {/* Account Number Card */}
                                    <section className="bg-surface/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Shield size={120} />
                                        </div>

                                        <h2 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">Hesap Numaranız</h2>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="font-mono text-3xl md:text-4xl font-black tracking-[0.2em] text-white">
                                                {accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
                                            </div>

                                            <button
                                                onClick={handleCopy}
                                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${copied ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white text-black hover:bg-gray-200'
                                                    }`}
                                            >
                                                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                                {copied ? 'KOPYALANDI' : 'KOPYALA'}
                                            </button>
                                        </div>

                                        <p className="mt-8 text-gray-400 text-sm leading-relaxed max-w-xl font-medium">
                                            Bu numara hem kullanıcı adınız hem de şifrenizdir. Lütfen kaybetmeyin,
                                            güvenliğiniz için bu numarayı başka kimseyle paylaşmayın.
                                        </p>
                                    </section>

                                    {/* Security Notice */}
                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4 items-start">
                                        <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Gizlilik Odaklı Altyapı</h4>
                                            <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                Flixify, Mullvad tabanlı anonimlik protokollerini kullanır. Hiçbir kişisel veri, IP adresi veya e-posta
                                                tarafımızca saklanmaz. Sizinle bağlantımız sadece bu 16 haneli numaradır.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'plans' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <header className="mb-10">
                                    <h1 className="text-4xl font-black tracking-tight mb-2">PAKETLER</h1>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Hesabınıza süre ekleyin</p>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={`relative bg-surface/50 border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.02] ${plan.popular ? 'border-primary shadow-2xl shadow-primary/10' : 'border-white/10'
                                                }`}
                                        >
                                            {plan.popular && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                                    En Çok Seçilen
                                                </div>
                                            )}

                                            <h3 className="text-2xl font-black mb-1">{plan.months} AY</h3>
                                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">{plan.months * 30} GÜN</div>

                                            <div className="mb-8">
                                                <span className="text-4xl font-black">{plan.price}</span>
                                                <span className="text-gray-400 text-sm font-bold ml-2">/tek sefer</span>
                                            </div>

                                            <p className="text-gray-400 text-sm mb-10 flex-grow font-medium">
                                                {plan.description}
                                            </p>

                                            <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider transition-all duration-300 ${plan.popular ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20' : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}>
                                                SATIN AL
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment Methods */}
                                <div className="bg-surface/30 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                                    <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-8 text-center">ÖDEME YÖNTEMLERİ</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                                        <div className="flex flex-col items-center gap-3 group grayscale hover:grayscale-0 transition-all">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl group-hover:bg-primary/10">
                                                <CreditCard className="text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Kredi Kartı</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-3 group grayscale hover:grayscale-0 transition-all">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl group-hover:bg-primary/10">
                                                <Zap className="text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Kripto Para</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-3 group grayscale hover:grayscale-0 transition-all">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl group-hover:bg-primary/10">
                                                <Receipt className="text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Banka Havalesi</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-3 group grayscale hover:grayscale-0 transition-all">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl group-hover:bg-primary/10">
                                                <ExternalLink className="text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300">Diğer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'devices' || activeTab === 'billing' || activeTab === 'settings') && (
                            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                                <section className="p-12 bg-white/5 border border-white/10 rounded-full mb-8">
                                    <Clock size={48} className="text-primary opacity-50" />
                                </section>
                                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">PEK YAKINDA</h3>
                                <p className="text-gray-400 font-bold max-w-sm text-center">
                                    Bu bölüm şu an geliştirme aşamasındadır. Çok yakında tüm özellikleri ile aktif edilecektir.
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

