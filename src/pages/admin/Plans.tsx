import { useState, useEffect } from 'react';
import { CreditCard, Plus, Save, Trash2, Edit2, X, Zap, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Plan {
    id: string;
    name: string;
    months: number;
    price: string;
    description: string;
    is_popular: boolean;
    created_at: string;
}

export default function Plans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [updating, setUpdating] = useState(false);

    const [name, setName] = useState('');
    const [months, setMonths] = useState(1);
    const [price, setPrice] = useState('₺149');
    const [description, setDescription] = useState('');
    const [isPopular, setIsPopular] = useState(false);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('plans').select('*').order('months', { ascending: true });
            if (error) {
                console.warn('Plans error:', error);
                setPlans([]);
            } else {
                setPlans(data || []);
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const resetForm = () => {
        setName('');
        setMonths(1);
        setPrice('₺149');
        setDescription('');
        setIsPopular(false);
        setEditingPlan(null);
    };

    const handleOpenModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setName(plan.name);
            setMonths(plan.months);
            setPrice(plan.price);
            setDescription(plan.description);
            setIsPopular(plan.is_popular);
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSavePlan = async () => {
        setUpdating(true);
        try {
            const planData = { name, months, price, description, is_popular: isPopular };

            if (editingPlan) {
                const { error } = await supabase.from('plans').update(planData).eq('id', editingPlan.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('plans').insert([planData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchPlans();
        } catch (err) {
            alert('Hata oluştu: ' + (err as any).message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;
            fetchPlans();
        } catch (err) {
            alert('Hata oluştu: ' + (err as any).message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto animation-fade-in relative z-10">
            <header className="mb-10 lg:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-3 uppercase bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Paket Yönetimi</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs lg:text-sm">VIP Abonelik planlarını kolayca yönet</p>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/40 transition-colors -z-10" />
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:scale-[1.02]"
                    >
                        <Plus size={20} strokeWidth={3} />
                        YENİ PAKET OLUŞTUR
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-32 flex justify-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(var(--primary),0.5)]"></div>
                    </div>
                ) : plans.length > 0 ? (
                    plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`
                                relative overflow-hidden rounded-[2rem] p-1 
                                ${plan.is_popular ? 'bg-gradient-to-br from-primary via-primary/50 to-transparent shadow-[0_0_40px_rgba(var(--primary),0.15)] scale-[1.02] -translate-y-2' : 'bg-white/5 border border-white/10'}
                                group transition-all duration-300 hover:scale-[1.03]
                            `}
                        >
                            <div className={`h-full bg-surface/90 backdrop-blur-2xl rounded-[1.8rem] p-8 lg:p-10 relative flex flex-col ${plan.is_popular ? 'border border-primary/20' : ''}`}>
                                {plan.is_popular && (
                                    <>
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 scale-150">
                                            <Zap size={150} />
                                        </div>
                                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/30 blur-3xl rounded-full" />
                                    </>
                                )}

                                <div className="relative z-10 flex-1">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            {plan.is_popular && (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/30 mb-4 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                                                    <Zap size={10} className="fill-current" />
                                                    POPÜLER
                                                </div>
                                            )}
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-white">{plan.name}</h3>
                                            <div className="text-gray-400 font-bold text-xs tracking-[0.2em] mt-2 uppercase">{plan.months} AY / {plan.months * 30} GÜN</div>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-2 mb-8">
                                        <span className={`text-5xl font-black tracking-tighter ${plan.is_popular ? 'text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'text-white'}`}>{plan.price}</span>
                                    </div>

                                    <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-8" />

                                    <ul className="space-y-4 mb-10 text-sm font-bold text-gray-400">
                                        {plan.description.split('\n').map((line, idx) => line.trim() && (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className={`mt-0.5 rounded-full p-0.5 ${plan.is_popular ? 'text-primary bg-primary/10' : 'text-gray-400 bg-white/5'}`}>
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                                <span className="leading-relaxed">{line}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10 mt-auto pt-6">
                                    <button
                                        onClick={() => handleOpenModal(plan)}
                                        className="py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-black uppercase tracking-widest text-[10px] border border-white/5 flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={14} />
                                        DÜZENLE
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-black uppercase tracking-widest text-[10px] border border-red-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        SİL
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 bg-surface/30 border border-white/5 border-dashed rounded-[3rem] backdrop-blur-sm flex flex-col items-center justify-center">
                        <CreditCard size={64} className="text-gray-600 mb-6 opacity-30" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Henüz paket tanımlanmamış.</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase w-1/2 text-center leading-relaxed">Yeni bir paket oluşturarak kullanıcılarınıza abonelik seçenekleri sunmaya başlayın.</p>
                    </div>
                )}
            </div>

            {/* Plan Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />

                    <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-8 pb-6 border-b border-white/5 flex justify-between items-start bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                                    {editingPlan ? 'PAKETİ DÜZENLE' : 'YENİ PAKET OLUŞTUR'}
                                </h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Abonelik planının tüm detaylarını ayarlayın</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-3 ml-1">Paket Adı</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Örn: 3 AYLIK GOLD PAKET"
                                    className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm font-black text-white placeholder:text-gray-700 shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-3 ml-1">Süre (Ay)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={months}
                                        onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
                                        className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-lg font-black text-white shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-3 ml-1">Fiyat</label>
                                    <input
                                        type="text"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="₺149"
                                        className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-lg font-black font-mono tracking-wider text-white shadow-inner"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-3 ml-1 flex justify-between">
                                    Açıklama / Özellikler
                                    <span className="text-gray-600 font-medium">Her satır bir özellik olarak listelenir</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="4K Ultra HD Yayın kalitesi&#10;Tüm cihazlarda izleme imkanı&#10;7/24 Kesintisiz destek..."
                                    rows={4}
                                    className="w-full px-5 py-4 bg-black/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all text-sm font-bold text-white placeholder:text-gray-700 resize-none shadow-inner leading-relaxed"
                                />
                            </div>

                            <label className="flex items-center gap-4 cursor-pointer group p-4 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isPopular}
                                        onChange={(e) => setIsPopular(e.target.checked)}
                                        className="w-6 h-6 border-2 border-white/20 rounded bg-black/50 appearance-none checked:bg-primary checked:border-primary transition-all cursor-pointer checked:before:content-['✓'] checked:before:text-white checked:before:absolute checked:before:inset-0 checked:before:flex checked:before:items-center checked:before:justify-center checked:before:font-black shadow-inner"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-sm font-black uppercase tracking-wider group-hover:text-primary transition-colors">Öne Çıkarılan / Popüler</span>
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Bu paket arayüzde parlayarak dikkat çekecektir.</span>
                                </div>
                            </label>
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-white bg-transparent hover:bg-white/5 border border-white/10 rounded-2xl transition-colors"
                            >
                                VAZGEÇ
                            </button>
                            <button
                                onClick={handleSavePlan}
                                disabled={updating}
                                className="flex-[2] py-4 bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50"
                            >
                                {updating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        {editingPlan ? 'DEĞİŞİKLİKLERİ KAYDET' : 'PAKETİ YAYINLA'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
