import React, { useState } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Trash2, GripHorizontal, Lock, Unlock, Copy } from 'lucide-react';
import type { Note } from '../../core/types';
import { NOTE_COLOR_MAP } from '../../core/constants';
import Tooltip from './Tooltip';

interface StickyNoteProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onCopy: () => void;
  onSelect: () => void;
  zoom: number;
}

const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete, onCopy, onSelect, zoom }) => {
  const [isEditing, setIsEditing] = useState(false);
  const x = useMotionValue(note.x);
  const y = useMotionValue(note.y);

  // Sync motion values with props for remote updates
  React.useEffect(() => {
    x.set(note.x);
    y.set(note.y);
  }, [note.x, note.y, x, y]);

  const rafRef = React.useRef<number | null>(null);
  const startPosRef = React.useRef({ x: 0, y: 0 });

  const handleDragStart = () => {
    startPosRef.current = { x: note.x, y: note.y };
  };

  const handleDrag = (_: any, info: any) => {
    if (note.isLocked) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      onUpdate(note.id, {
        x: startPosRef.current.x + info.offset.x / zoom,
        y: startPosRef.current.y + info.offset.y / zoom,
      });
      rafRef.current = null;
    });
  };

  const handleDragEnd = (_: any, info: any) => {
    if (note.isLocked) return;
    // Final authoritative position commit
    onUpdate(note.id, {
      x: startPosRef.current.x + info.offset.x / zoom,
      y: startPosRef.current.y + info.offset.y / zoom,
    });
  };

  const isDark = note.color === 'orange';
  const colorClass = NOTE_COLOR_MAP[note.color] ?? NOTE_COLOR_MAP.cream;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'c') {
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
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: note.isLocked ? 1 : 1.02, zIndex: 50 }}
      whileTap={{ scale: note.isLocked ? 1 : 0.98, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`absolute w-[200px] min-h-[200px] p-6 focus:outline-none focus:ring-2 focus:ring-stone-500/20 ${
        note.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      } sticky-shadow border organic-radius ${colorClass} flex flex-col group`}
    >
      <div className="flex justify-between items-start mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          {!note.isLocked && <GripHorizontal className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-stone-400'}`} />}
          <Tooltip content={note.isLocked ? 'Unlock' : 'Lock'} position="top">
            <button onClick={() => onUpdate(note.id, { isLocked: !note.isLocked })}
              className={`transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-stone-400 hover:text-stone-600'}`}>
              {note.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
          {!note.isLocked && (
            <Tooltip content="Copy Note" position="top">
              <button onClick={onCopy}
                className={`transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-stone-400 hover:text-stone-600'}`}>
                <Copy className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
        {!note.isLocked && (
          <Tooltip content="Delete Note" position="top">
            <button onClick={() => onDelete(note.id)}
              className={`hover:text-red-500 transition-colors ${isDark ? 'text-white/70' : 'text-stone-400'}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {isEditing && !note.isLocked ? (
        <textarea
          autoFocus
          className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden h-full font-serif italic text-lg leading-snug ${
            isDark ? 'text-white' : 'text-stone-800'
          } px-1`}
          value={note.content}
          onChange={e => onUpdate(note.id, { content: e.target.value })}
          onBlur={() => setIsEditing(false)}
          rows={4}
        />
      ) : (
        <div
          className={`w-full h-full font-serif italic text-lg leading-snug select-none overflow-hidden break-words whitespace-pre-wrap ${
            isDark ? 'text-white' : 'text-stone-800'
          } pr-2 pl-1 pt-1 pb-1`}
          onDoubleClick={() => !note.isLocked && setIsEditing(true)}
        >
          {note.content || (note.isLocked ? '' : 'Jot something down...')}
        </div>
      )}

      {!note.isLocked && (
        <div className="mt-auto pt-4 flex gap-1.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity">
          {Object.keys(NOTE_COLOR_MAP).map(c => (
            <button
              key={c}
              onClick={() => onUpdate(note.id, { color: c })}
              className={`w-3 h-3 rounded-full border border-black/10 ${NOTE_COLOR_MAP[c].split(' ')[0]}`}
            />
          ))}
        </div>
      )}

      {note.author && (
        <div className="absolute bottom-3 right-4 flex items-center gap-2 pointer-events-none">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black border border-black/5 shadow-sm transition-opacity opacity-40 group-hover:opacity-100 ${
            isDark ? 'bg-white/20 text-white' : 'bg-stone-900 text-white'
          }`}>
            {note.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity ${isDark ? 'text-white' : 'text-stone-500'}`}>
            {note.author}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default StickyNote;
