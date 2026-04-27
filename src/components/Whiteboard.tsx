import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Maximize, Minus, Download, Undo2, Redo2, Pencil, Eraser, Ruler as RulerIcon, Users, Trash2 } from 'lucide-react';
import StickyNote from './StickyNote';
import Ruler from './Ruler';
import DrawingCanvas from './DrawingCanvas';
import CollaboratorList from './CollaboratorList';
import Tooltip from './Tooltip';
import AudioSettings from './AudioSettings';
import { Note, Stroke, Point, Participant } from '../types';
import { toPng } from 'html-to-image';
import { useWhiteboardAudio } from '../hooks/useWhiteboardAudio';

interface WhiteboardState {
  notes: Note[];
  strokes: Stroke[];
}

interface WhiteboardProps {
  groupName: string;
  leaderName: string;
}

export default function Whiteboard({ groupName, leaderName }: WhiteboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [appMode, setAppMode] = useState<'select' | 'pen' | 'eraser'>('select');
  const [showRuler, setShowRuler] = useState(false);
  const [rulerTransform, setRulerTransform] = useState({ x: 100, y: 100, rotate: 0 });
  const [brushSettings, setBrushSettings] = useState({
    color: '#333333',
    width: 3,
    style: 'solid' as 'solid' | 'dashed' | 'dotted'
  });
  const [eraserSettings, setEraserSettings] = useState({
    size: 40,
    shape: 'circle' as 'circle' | 'square'
  });
  const [history, setHistory] = useState<WhiteboardState[]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardState[]>([]);
  const [copiedNote, setCopiedNote] = useState<Note | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // --- AUDIO LOGIC ---
  const [localUserId] = useState(() => `user-${Math.random().toString(36).substr(2, 4)}`);
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([
    { id: 'lena', name: 'Lena', x: -400, y: -200 },
    { id: 'marcus', name: 'Marcus', x: 600, y: 300 },
    { id: 'alex', name: 'Alex', x: 200, y: -500 }
  ]);

  const { isJoined, isMicEnabled, initAudio, toggleMic, speakerLevels } = useWhiteboardAudio(
    localUserId,
    remoteParticipants,
    { x: -transform.x / transform.scale, y: -transform.y / transform.scale },
    true
  );

  // Simulate remote user movement occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      setRemoteParticipants(prev => prev.map(p => ({
        ...p,
        x: p.x + (Math.random() - 0.5) * 5,
        y: p.y + (Math.random() - 0.5) * 5,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  // --- END AUDIO LOGIC ---

  // Autosave and Initial Load
  useEffect(() => {
    const savedNotes = localStorage.getItem('mura_whiteboard_notes');
    const savedStrokes = localStorage.getItem('mura_whiteboard_strokes');
    
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) { console.error(e); }
    } else {
      addNote();
    }

    if (savedStrokes) {
      try {
        setStrokes(JSON.parse(savedStrokes));
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('mura_whiteboard_notes', JSON.stringify(notes));
      localStorage.setItem('mura_whiteboard_strokes', JSON.stringify(strokes));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [notes, strokes]);

  const saveToHistory = useCallback((currentNotes: Note[], currentStrokes: Stroke[]) => {
    setHistory(prev => [...prev.slice(-19), { notes: currentNotes, strokes: currentStrokes }]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(prevRedo => [...prevRedo, { notes, strokes }]);
    setNotes(prev.notes);
    setStrokes(prev.strokes);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  }, [history, notes, strokes]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prevHistory => [...prevHistory, { notes, strokes }]);
    setNotes(next.notes);
    setStrokes(next.strokes);
    setRedoStack(prevRedo => prevRedo.slice(0, -1));
  }, [redoStack, notes, strokes]);

  const pasteNote = useCallback(() => {
    if (!copiedNote) return;
    saveToHistory(notes, strokes);
    const newNote: Note = {
      ...copiedNote,
      id: Math.random().toString(36).substr(2, 9),
      x: copiedNote.x + 20,
      y: copiedNote.y + 20,
      rotation: Math.random() * 6 - 3,
      isLocked: false,
    };
    setNotes(prev => [...prev, newNote]);
  }, [copiedNote, notes, strokes, saveToHistory]);

  const addNote = useCallback(() => {
    saveToHistory(notes, strokes);
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      x: -transform.x / transform.scale + (window.innerWidth / 2 - 100) / transform.scale,
      y: -transform.y / transform.scale + (window.innerHeight / 2 - 100) / transform.scale,
      content: "",
      color: ['sage', 'cream', 'peach', 'orange'][Math.floor(Math.random() * 4)],
      rotation: Math.random() * 6 - 3,
      isLocked: false,
    };
    setNotes(prev => [...prev, newNote]);
  }, [transform, notes, strokes, saveToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && (e.key === 'z' || (isMac && e.key === 'Z'))) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if (cmdOrCtrl && e.key === 'y') {
        redo();
        e.preventDefault();
      } else if (cmdOrCtrl && e.key === 'v') {
        pasteNote();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, pasteNote]);

  const updateNote = (id: string, updates: Partial<Note>) => {
    const significantChange = 'isLocked' in updates || 'color' in updates;
    if (significantChange) saveToHistory(notes, strokes);
    
    setNotes(prev => prev.map(note => note.id === id ? { ...note, ...updates } : note));
  };

  const deleteNote = (id: string) => {
    saveToHistory(notes, strokes);
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear all drawings and notes?")) {
      saveToHistory(notes, strokes);
      setNotes([]);
      setStrokes([]);
    }
  };

  const copyNote = (note: Note) => {
    setCopiedNote(note);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const zoomSpeed = 0.001;
      const newScale = Math.min(Math.max(transform.scale - e.deltaY * zoomSpeed, 0.1), 3);
      setTransform(prev => ({ ...prev, scale: newScale }));
    } else {
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      return;
    }

    if (appMode === 'pen' && e.button === 0) {
      if (!rect) return;
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      
      setCurrentStroke({
        id: Math.random().toString(36).substr(2, 9),
        points: [{ x, y }],
        color: brushSettings.color,
        width: brushSettings.width / transform.scale,
        dashArray: brushSettings.style === 'dashed' ? `${8 / transform.scale},${8 / transform.scale}` : 
                   brushSettings.style === 'dotted' ? `${1 / transform.scale},${8 / transform.scale}` : undefined
      });
    } else if (appMode === 'eraser' && e.button === 0) {
      if (!rect) return;
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      
      const threshold = (eraserSettings.size / 2) / transform.scale;
      const toRemove = strokes.filter(s => 
        s.points.some(p => {
          if (eraserSettings.shape === 'circle') {
            return Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < threshold;
          } else {
            return Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold;
          }
        })
      );
      
      if (toRemove.length > 0) {
        saveToHistory(notes, strokes);
        setStrokes(prev => prev.filter(s => !toRemove.includes(s)));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (isPanning) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
      return;
    }

    if (currentStroke && appMode === 'pen') {
      if (!rect) return;
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      
      setCurrentStroke(prev => prev ? ({
        ...prev,
        points: [...prev.points, { x, y }]
      }) : null);
    } else if (appMode === 'eraser' && (e.buttons & 1)) {
      if (!rect) return;
      const x = (e.clientX - rect.left - transform.x) / transform.scale;
      const y = (e.clientY - rect.top - transform.y) / transform.scale;
      
      const threshold = (eraserSettings.size / 2) / transform.scale;
      const toRemove = strokes.filter(s => 
        s.points.some(p => {
          if (eraserSettings.shape === 'circle') {
            return Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < threshold;
          } else {
            return Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold;
          }
        })
      );
      
      if (toRemove.length > 0) {
        saveToHistory(notes, strokes);
        setStrokes(prev => prev.filter(s => !toRemove.includes(s)));
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (currentStroke) {
      saveToHistory(notes, strokes);
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const exportAsImage = async () => {
    if (!surfaceRef.current) return;
    try {
      const dataUrl = await toPng(surfaceRef.current, {
        backgroundColor: '#FDFCF0',
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `whiteboard-${new Date().toISOString()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-screen h-screen overflow-hidden bg-canvas cursor-default select-none transition-colors duration-500 ${appMode !== 'select' ? 'cursor-crosshair' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Eraser Cursor Feedback */}
      {appMode === 'eraser' && (
        <div 
          className={`absolute pointer-events-none border-2 border-stone-400 bg-white/20 backdrop-blur-[1px] shadow-sm z-[100] ${eraserSettings.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
          style={{
            left: mousePos.x,
            top: mousePos.y,
            width: eraserSettings.size,
            height: eraserSettings.size,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Audio Settings Panel */}
      <AudioSettings 
        isJoined={isJoined}
        isMicEnabled={isMicEnabled}
        onJoin={initAudio}
        onToggleMic={toggleMic}
        speakerLevels={speakerLevels}
      />

      {/* Group Info Branding */}
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

      <CollaboratorList 
        localUser={{ id: localUserId, name: leaderName }} 
        participants={remoteParticipants}
        leaderName={leaderName}
        speakerLevels={speakerLevels}
      />

      {/* Background Grid */}
      <div 
        className="absolute inset-0 canvas-grid pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
      />

      {/* Infinite Surface */}
      <div 
        ref={surfaceRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        <DrawingCanvas 
          strokes={strokes}
          currentStroke={currentStroke}
          transform={transform}
        />

        <AnimatePresence>
          {notes.map((note: Note) => (
            <StickyNote 
              key={note.id}
              note={note}
              onUpdate={updateNote}
              onDelete={deleteNote}
              onCopy={() => copyNote(note)}
              onSelect={() => updateNote(note.id, { rotation: note.rotation + (Math.random() * 2 - 1) })}
              zoom={transform.scale}
            />
          ))}
        </AnimatePresence>

        {/* Remote Participants */}
        {remoteParticipants.map((p) => {
          const level = speakerLevels[p.id] || 0;
          return (
            <motion.div
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ x: p.x, y: p.y, scale: 1 }}
              className="absolute pointer-events-none"
            >
              <div className="relative flex flex-col items-center">
                {/* Vocal Aura */}
                <motion.div
                  animate={{
                    scale: 1 + level / 40,
                    opacity: 0.1 + (level / 100) * 0.3,
                  }}
                  className="absolute w-32 h-32 bg-stone-500 rounded-full blur-2xl translate-y-[-50%]"
                />
                
                <div className="w-10 h-10 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center flex-shrink-0 z-10 overflow-hidden">
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-400 uppercase">
                    {p.name[0]}
                  </div>
                </div>
                
                <div className="mt-2 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-stone-100 shadow-sm z-10 translate-y-[-4px]">
                  <span className="text-[10px] font-extrabold text-stone-900 uppercase tracking-widest">{p.name}</span>
                </div>

                {/* Speaker Indicator */}
                {level > 5 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-20 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                  />
                )}
              </div>
            </motion.div>
          );
        })}

        {showRuler && (
          <Ruler 
            transform={rulerTransform}
            onUpdate={(u) => setRulerTransform(prev => ({ ...prev, ...u }))}
            zoom={transform.scale}
          />
        )}
      </div>

      {/* Branding */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <div className="text-xl font-bold tracking-tight text-stone-900 group">
          Aura Whiteboard <span className="font-light opacity-50 ml-1">/ Creative Sprint</span>
        </div>
      </div>

      {/* User Overlays */}
      <div className="absolute top-8 right-8 flex items-center -space-x-3">
        {[
          { color: '#D1D9CF', name: 'Lena' },
          { color: '#F3EAC2', name: 'Marcus' },
          { color: '#D97706', name: 'Alex' }
        ].map((u, i) => (
          <Tooltip key={i} content={u.name} position="bottom">
            <div 
              className="w-8 h-8 rounded-full border-2 border-canvas shadow-sm cursor-help transition-transform hover:scale-110"
              style={{ backgroundColor: u.color }}
            />
          </Tooltip>
        ))}
        <Tooltip content="4 active guests" position="bottom">
          <div className="w-8 h-8 rounded-full border-2 border-canvas bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold shadow-sm cursor-help hover:scale-110 transition-transform">
            +4
          </div>
        </Tooltip>
      </div>

      {/* Brush Settings Panel */}
      <AnimatePresence>
        {appMode === 'pen' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-4 p-4 bg-white border border-black/5 rounded-2xl shadow-xl z-50 min-w-[280px]"
          >
            {/* Colors */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Brush Color</span>
              <div className="flex gap-2">
                {['#333333', '#C66B3D', '#7C8370', '#2563EB', '#DB2777'].map(c => (
                  <button
                    key={c}
                    onClick={() => setBrushSettings(s => ({ ...s, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${brushSettings.color === c ? 'border-stone-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Brush Size</span>
              <div className="flex items-center gap-4">
                {[1, 3, 6, 12, 24].map(w => (
                  <button
                    key={w}
                    onClick={() => setBrushSettings(s => ({ ...s, width: w }))}
                    className={`flex items-center justify-center rounded-lg transition-all ${brushSettings.width === w ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <div 
                      className="rounded-full bg-current" 
                      style={{ width: Math.max(2, w / 2), height: Math.max(2, w / 2) }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Styles */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Line Style</span>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setBrushSettings(s => ({ ...s, style }))}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${brushSettings.style === style ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eraser Settings Panel */}
      <AnimatePresence>
        {appMode === 'eraser' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-4 p-4 bg-white border border-black/5 rounded-2xl shadow-xl z-50 min-w-[280px]"
          >
            {/* Sizes */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Eraser Size</span>
              <div className="flex items-center gap-4">
                {[10, 20, 40, 80, 160].map(s => (
                  <button
                    key={s}
                    onClick={() => setEraserSettings(es => ({ ...es, size: s }))}
                    className={`flex items-center justify-center p-1 rounded-lg transition-all ${eraserSettings.size === s ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                  >
                    <div 
                      className={`border-2 border-current ${eraserSettings.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                      style={{ width: Math.max(6, s / 8), height: Math.max(6, s / 8) }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Shapes */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Eraser Shape</span>
              <div className="flex gap-2">
                {(['circle', 'square'] as const).map(shape => (
                  <button
                    key={shape}
                    onClick={() => setEraserSettings(es => ({ ...es, shape }))}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${eraserSettings.shape === shape ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-5 px-6 py-3 bg-white border border-black/5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2">
          <Tooltip content="Selection Tool">
            <button 
              onClick={() => setAppMode('select')}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all ${appMode === 'select' ? 'bg-stone-900 text-white translate-y-[-2px]' : 'bg-canvas text-stone-900 hover:bg-stone-100'}`}
            >
              <Maximize className="w-4 h-4 rotate-45" />
            </button>
          </Tooltip>

          <Tooltip content="Pen Tool">
            <button 
              onClick={() => setAppMode('pen')}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all ${appMode === 'pen' ? 'bg-stone-900 text-white translate-y-[-2px]' : 'bg-canvas text-stone-900 hover:bg-stone-100'}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Eraser Tool">
            <button 
              onClick={() => setAppMode('eraser')}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all ${appMode === 'eraser' ? 'bg-stone-900 text-white translate-y-[-2px]' : 'bg-canvas text-stone-900 hover:bg-stone-100'}`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Ruler Tool">
            <button 
              onClick={() => setShowRuler(!showRuler)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all ${showRuler ? 'bg-stone-900 text-white translate-y-[-2px]' : 'bg-canvas text-stone-900 hover:bg-stone-100'}`}
            >
              <RulerIcon className="w-4 h-4" />
            </button>
          </Tooltip>
          
          <Tooltip content="Add Sticky Note">
            <button onClick={addNote} className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer group">
              <Plus className="w-5 h-5 text-stone-900 group-active:scale-90 transition-transform" />
            </button>
          </Tooltip>

          <Tooltip content="Undo Action">
            <button 
              onClick={undo} 
              disabled={history.length === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Undo2 className="w-4 h-4 text-stone-900" />
            </button>
          </Tooltip>

          <Tooltip content="Redo Action">
            <button 
              onClick={redo} 
              disabled={redoStack.length === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Redo2 className="w-4 h-4 text-stone-900" />
            </button>
          </Tooltip>

          <Tooltip content="Export as PNG">
            <button onClick={exportAsImage} className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer text-stone-900">
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Clear Canvas">
            <button onClick={clearCanvas} className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer text-stone-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
        
        <div className="w-px h-6 bg-stone-200" />

        <Tooltip content="Collaborate">
          <button className="text-xs font-bold uppercase tracking-widest text-stone-900 hover:opacity-70 transition-opacity px-2">
            Share
          </button>
        </Tooltip>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col bg-white border border-stone-100 rounded-lg shadow-sm overflow-hidden">
        <Tooltip content="View State" position="left">
          <div className="px-3 py-2 text-[12px] font-bold text-center border-b border-stone-100 min-w-[50px] cursor-default">
            {Math.round(transform.scale * 100)}%
          </div>
        </Tooltip>
        
        <Tooltip content="Zoom In" position="left">
          <button 
            onClick={() => setTransform(p => ({ ...p, scale: Math.min(p.scale + 0.1, 3) }))}
            className="p-2.5 hover:bg-stone-50 text-stone-600 transition-colors w-full flex justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Zoom Out" position="left">
          <button 
            onClick={() => setTransform(p => ({ ...p, scale: Math.max(p.scale - 0.1, 0.1) }))}
            className="p-2.5 hover:bg-stone-50 text-stone-600 transition-colors border-t border-stone-50 w-full flex justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="absolute bottom-4 right-4 text-[10px] text-stone-400 font-mono pointer-events-none opacity-50">
        AUTOSAVING TO LOCALSTORAGE
      </div>
    </div>
  );
}

