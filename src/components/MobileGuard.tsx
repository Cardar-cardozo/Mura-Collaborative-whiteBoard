
import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const DESKTOP_BREAKPOINT = 768; // px

function isMobileDevice(): boolean {
  return (
    window.innerWidth < DESKTOP_BREAKPOINT ||
    ('ontouchstart' in window && window.innerWidth < 1024)
  );
}

interface MobileGuardProps {
  children: React.ReactNode;
}

const MobileGuard: React.FC<MobileGuardProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!isMobile) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FDFCF0] flex items-center justify-center p-8 text-center font-sans">
      <div className="max-w-xs flex flex-col items-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center">
            <Monitor className="w-10 h-10 text-stone-900" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-4 border-[#FDFCF0] rounded-full flex items-center justify-center shadow-sm">
            <Smartphone className="w-4 h-4 text-red-400" />
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-bold text-stone-900 tracking-tight mb-3"
        >
          Desktop Recommended
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-stone-500 text-sm leading-relaxed mb-8"
        >
          Mura Whiteboard requires a large screen and precise input for the best collaborative experience. Please switch to a desktop or laptop.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300"
        >
          <span>Mobile App Coming Soon</span>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileGuard;
