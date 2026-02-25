import { Tv, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  showReturnLink?: boolean;
}

export function UpgradePrompt({ 
  title = 'Henüz Bir Paketiniz Yok',
  description = 'Binlerce film, dizi ve canlı kanalı izlemeye başlamak için hesabınıza bir yayın paketi tanımlamanız gerekmektedir.',
  showReturnLink = false 
}: UpgradePromptProps) {
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
      
      {/* Background Gradient Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-lg w-full relative z-10 flex flex-col items-center">
        
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 relative"
        >
          <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
          <div className="relative w-24 h-24 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center shadow-2xl">
            <Tv size={40} className="text-red-500" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight"
        >
          {title}
        </motion.h2>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-base leading-relaxed mb-10 max-w-md mx-auto font-medium"
        >
          {description}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-sm"
        >
          <Link
            to="/profil" // Redirect to profile to buy package
            className="group flex items-center justify-center gap-3 w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] shadow-lg shadow-red-900/20"
          >
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
            <span className="tracking-wide text-sm md:text-base">PAKETLERİ İNCELE & SATIN AL</span>
          </Link>
        </motion.div>

        {/* Footer Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-500 text-xs leading-5">
            Satın alım sonrası erişiminiz anında açılacaktır.
            <br />
            Sorularınız için destek hattımıza ulaşabilirsiniz.
          </p>
        </motion.div>

      </div>
    </div>
  );
}

export default UpgradePrompt;
