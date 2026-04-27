import React, { useState } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Note } from '../types';
import { Trash2, GripHorizontal, Lock, Unlock, Copy } from 'lucide-react';
import Tooltip from './Tooltip';

export interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onCopy: () => void;
  onSelect: () => void;
  zoom: number;
}

const colorMap: Record<string, string> = {
  sage: 'bg-[#D1D9CF] border-[#B8C2B6]',
  cream: 'bg-[#F3EAC2] border-[#E5DBA9]',
  peach: 'bg-[#F9E2D2] border-[#EBCDB9]',
  orange: 'bg-[#D97706] text-white border-[#C06905]',
};

const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete, onCopy, onSelect, zoom }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Use springs for smooth movement
  const x = useMotionValue(note.x);
  const y = useMotionValue(note.y);

  const handleDragEnd = (_: any, info: any) => {
    if (note.isLocked) return;
    onUpdate(note.id, {
      x: note.x + info.offset.x / zoom,
      y: note.y + info.offset.y / zoom,
    });
  };

  const isDarkColor = note.color === 'orange';

  // Local handler for keydown within the note (e.g. Ctrl+C)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    if (cmdOrCtrl && e.key === 'c') {
      onCopy();
      e.stopPropagation();
    }
  };

  return (
    <motion.div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={() => !note.isLocked && onSelect()}
      style={{ x, y, rotate: note.rotation }}
      drag={!note.isLocked}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: note.isLocked ? 1 : 1.02, zIndex: 50 }}
      whileTap={{ scale: note.isLocked ? 1 : 0.98, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`absolute w-[200px] min-h-[200px] p-6 focus:outline-none focus:ring-2 focus:ring-stone-500/20 ${note.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} sticky-shadow border organic-radius ${colorMap[note.color] || colorMap.cream} flex flex-col group`}
    >
      <div className="flex justify-between items-start mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          {!note.isLocked && <GripHorizontal className={`w-4 h-4 ${isDarkColor ? 'text-white/50' : 'text-stone-400'}`} />}
          <Tooltip content={note.isLocked ? "Unlock" : "Lock"} position="top">
            <button 
              onClick={() => onUpdate(note.id, { isLocked: !note.isLocked })}
              className={`transition-colors ${isDarkColor ? 'text-white/70 hover:text-white' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {note.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
          {!note.isLocked && (
            <Tooltip content="Copy Note" position="top">
              <button 
                onClick={onCopy}
                className={`transition-colors ${isDarkColor ? 'text-white/70 hover:text-white' : 'text-stone-400 hover:text-stone-600'}`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
        {!note.isLocked && (
          <Tooltip content="Delete Note" position="top">
            <button 
              onClick={() => onDelete(note.id)}
              className={`hover:text-red-500 transition-colors ${isDarkColor ? 'text-white/70' : 'text-stone-400'}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {isEditing && !note.isLocked ? (
        <textarea
          autoFocus
          className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden h-full font-serif italic text-lg leading-snug ${isDarkColor ? 'text-white' : 'text-stone-800'} px-1`}
          value={note.content}
          onChange={(e) => onUpdate(note.id, { content: e.target.value })}
          onBlur={() => setIsEditing(false)}
          rows={4}
        />
      ) : (
        <div 
          className={`w-full h-full font-serif italic text-lg leading-snug select-none overflow-hidden break-words whitespace-pre-wrap ${isDarkColor ? 'text-white' : 'text-stone-800'} pr-2 pl-1 pt-1 pb-1`}
          onDoubleClick={() => !note.isLocked && setIsEditing(true)}
        >
          {note.content || (note.isLocked ? "" : "Jot something down...")}
        </div>
      )}

      {!note.isLocked && (
        <div className="mt-auto pt-4 flex gap-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
          {Object.keys(colorMap).map((c) => (
            <button
              key={c}
              onClick={() => onUpdate(note.id, { color: c })}
              className={`w-3 h-3 rounded-full border border-black/10 ${colorMap[c].split(' ')[0]}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StickyNote;
