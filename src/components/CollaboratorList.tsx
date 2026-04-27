import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, User } from 'lucide-react';
import { Participant } from '../types';

interface CollaboratorListProps {
  localUser: { id: string; name: string };
  participants: Participant[];
  leaderName: string;
  speakerLevels: Record<string, number>;
}

const CollaboratorList: React.FC<CollaboratorListProps> = ({ 
  localUser, 
  participants, 
  leaderName, 
  speakerLevels 
}) => {
  return (
    <div className="absolute top-28 right-8 flex flex-col gap-2 z-50">
      <div className="flex flex-col gap-1 items-end">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mr-2 mb-1">Collaborators</span>
        
        {/* Local User */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 px-3 py-2 bg-white/90 backdrop-blur-md border border-stone-100 rounded-2xl shadow-sm"
        >
           <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-stone-900 leading-none">{localUser.name} (You)</span>
            <span className="text-[8px] text-stone-400 font-medium uppercase tracking-tighter mt-0.5">Active now</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 text-[10px] font-bold">
            {localUser.name[0].toUpperCase()}
          </div>
        </motion.div>

        {/* Remote Users */}
        <AnimatePresence>
          {participants.map((p) => {
            const level = speakerLevels[p.id] || 0;
            const isLeader = p.name === leaderName;
            
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-3 py-2 bg-white/40 backdrop-blur-sm border border-stone-50/50 rounded-2xl hover:bg-white/80 transition-colors"
              >
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    {isLeader && <Crown className="w-2.5 h-2.5 text-amber-500" />}
                    <span className="text-[10px] font-bold text-stone-900 leading-none">{p.name}</span>
                  </div>
                  {level > 10 && (
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-[8px] text-green-500 font-bold uppercase tracking-tighter mt-0.5"
                    >
                      Speaking
                    </motion.span>
                  )}
                </div>
                
                <div className="relative">
                   <motion.div 
                    animate={{ 
                      scale: level > 10 ? [1, 1.2, 1] : 1,
                      opacity: level > 10 ? [0.2, 0.5, 0.2] : 0
                    }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute inset-0 bg-green-500 rounded-xl"
                  />
                  <div className="relative w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 text-[10px] font-bold overflow-hidden">
                    {p.name[0].toUpperCase()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CollaboratorList;
