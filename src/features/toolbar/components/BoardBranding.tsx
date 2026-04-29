
import React from 'react';


interface BoardBrandingProps {
  groupName: string;
  leaderName: string;
}

const BoardBranding: React.FC<BoardBrandingProps> = ({ groupName, leaderName }) => (
  <>
    {/* App name */}
    <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none z-50">
      <div className="text-xl font-bold tracking-tight text-stone-900">
        Mura <span className="font-light opacity-50 ml-1">/ Whiteboard</span>
      </div>
    </div>

    {/* Group info chip */}
    <div className="absolute top-8 right-8 flex flex-col items-end z-50">
      <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-stone-100 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold text-xs">
          {groupName[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-900">{groupName}</span>
          <span className="text-[9px] text-stone-400 font-medium tracking-tight">Led by {leaderName}</span>
        </div>
      </div>
    </div>
  </>
);

export default BoardBranding;
