import React from 'react';
import { Mic, MicOff, Phone, PhoneOff, Settings2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioSettingsProps {
  isJoined: boolean;
  isMicEnabled: boolean;
  onJoin: () => void;
  onToggleMic: () => void;
  speakerLevels: Record<string, number>;
}

const AudioSettings: React.FC<AudioSettingsProps> = ({
  isJoined,
  isMicEnabled,
  onJoin,
  onToggleMic,
  speakerLevels
}) => {
  return (
    <div className="absolute top-24 left-8 flex flex-col gap-2 z-50">
      <AnimatePresence mode="wait">
        {!isJoined ? (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={onJoin}
            className="flex items-center gap-3 px-5 py-3 bg-stone-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex flex-col items-start translate-y-[-1px]">
              <span className="text-xs font-bold uppercase tracking-widest">Spatial Audio</span>
              <span className="text-[10px] opacity-50 font-medium">Click to join call</span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200 shadow-xl"
          >
            <button
              onClick={onToggleMic}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isMicEnabled 
                  ? 'bg-stone-900 text-white shadow-lg' 
                  : 'bg-red-50 text-red-500 border border-red-100'
              }`}
            >
              {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            
            <div className="w-px h-6 bg-stone-200" />
            
            <div className="flex items-center gap-1 px-2">
              <div className="flex gap-0.5 items-end h-3 w-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isMicEnabled ? [2, 10, 4, 8, 2] : 2 }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-1 bg-stone-900 rounded-full"
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900 ml-1">Live</span>
            </div>

            <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-stone-100 transition-colors">
              <Settings2 className="w-4 h-4 text-stone-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isJoined && Object.keys(speakerLevels).length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-1 mt-2"
        >
          {Object.entries(speakerLevels).map(([id, level]) => (
            <div key={id} className="flex items-center gap-2 px-3 py-1 bg-white/40 border border-stone-100 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">Remote User</span>
              <div className="flex-1 h-[2px] bg-stone-200 rounded-full overflow-hidden w-12">
                <motion.div 
                  className="h-full bg-stone-900" 
                  animate={{ width: `${level}%` }} 
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AudioSettings;
