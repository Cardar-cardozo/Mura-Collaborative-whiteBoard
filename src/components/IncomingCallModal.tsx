import React from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IncomingCallModalProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerName, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-stone-200 rounded-[32px] shadow-2xl pointer-events-auto overflow-hidden"
      >
        <div className="p-8 flex flex-col items-center text-center">
          {}
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-stone-900 rounded-full"
            />
            <div className="relative w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center text-white shadow-xl">
              <User className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-xl font-black text-stone-900 mb-1">Incoming Call</h3>
          <p className="text-stone-500 font-medium mb-8">
            <span className="text-stone-900 font-bold">{callerName}</span> is inviting you to spatial audio
          </p>

          <div className="flex gap-4 w-full">
            <button
              onClick={onReject}
              className="flex-1 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors font-bold text-sm"
            >
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                <PhoneOff className="w-4 h-4" />
              </div>
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl font-bold text-sm"
            >
              <div className="w-8 h-8 rounded-full bg-white text-stone-900 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              Accept
            </button>
          </div>
        </div>
        
        {}
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="h-1 w-full bg-gradient-to-r from-transparent via-stone-900 to-transparent opacity-10"
        />
      </motion.div>
    </div>
  );
};

export default IncomingCallModal;
