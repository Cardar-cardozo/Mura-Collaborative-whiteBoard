/**
 * Canvas.tsx — Pure rendering engine
 *
 * Responsibilities:
 *  - Renders the dot-grid background, the SVG stroke layer, and all StickyNotes
 *  - Delegates ALL event handling to useCanvasEvents (strategy pattern)
 *  - Reads ONLY from Zustand stores — never accepts tool-related props
 *  - Never renders the Toolbar, panels, or any other DOM UI
 */
import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useBoardStore } from '../../../store/useBoardStore';
import { useViewStore } from '../../../store/useViewStore';
import { useUIStore } from '../../../store/useUIStore';
import { useCanvasEvents } from '../hooks/useCanvasEvents';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { CANVAS_SVG_SIZE, CANVAS_SVG_OFFSET } from '../../../core/constants';
import StickyNote from '../../../shared/ui/StickyNote';
import Ruler from '../../../shared/ui/Ruler';

const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mousePos, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp } =
    useCanvasEvents(containerRef);

  useKeyboardShortcuts();

  // Store subscriptions
  const transform   = useViewStore(s => s.transform);
  const notes       = useBoardStore(s => s.notes);
  const strokes     = useBoardStore(s => s.strokes);
  const currentStroke = useBoardStore(s => s.currentStroke);
  const appMode       = useUIStore(s => s.appMode);
  const eraserSettings = useUIStore(s => s.eraserSettings);
  const showRuler     = useUIStore(s => s.showRuler);
  const rulerTransform = useUIStore(s => s.rulerTransform);
  const setRulerTransform = useUIStore(s => s.setRulerTransform);

  const updateNote = useBoardStore(s => s.updateNote);
  const deleteNote = useBoardStore(s => s.deleteNote);
  const copyNote   = useBoardStore(s => s.copyNote);

  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen overflow-hidden bg-canvas select-none transition-colors duration-500 ${
        appMode !== 'select' ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      {/* ── Eraser cursor overlay ─────────────────────────────────────────── */}
      {appMode === 'eraser' && (
        <div
          className={`absolute pointer-events-none border-2 border-stone-400 bg-white/20 backdrop-blur-[1px] shadow-sm z-[100] ${
            eraserSettings.shape === 'circle' ? 'rounded-full' : 'rounded-sm'
          }`}
          style={{
            left: mousePos.x,
            top: mousePos.y,
            width: eraserSettings.size,
            height: eraserSettings.size,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* ── Background dot-grid (follows camera) ─────────────────────────── */}
      <div
        className="absolute inset-0 canvas-grid pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      />

      {/* ── Infinite surface ─────────────────────────────────────────────── */}
      <div
        id="canvas-surface"
        className="absolute inset-0"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG stroke layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width:  `${CANVAS_SVG_SIZE}px`,
            height: `${CANVAS_SVG_SIZE}px`,
            top:  CANVAS_SVG_OFFSET,
            left: CANVAS_SVG_OFFSET,
          }}
          viewBox={`${CANVAS_SVG_OFFSET} ${CANVAS_SVG_OFFSET} ${CANVAS_SVG_SIZE} ${CANVAS_SVG_SIZE}`}
        >
          {strokes.map(stroke => (
            <path
              key={stroke.id}
              d={`M ${stroke.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeDasharray={stroke.dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-auto"
            >
              {stroke.author && <title>{`Drawn by ${stroke.author}`}</title>}
            </path>
          ))}
          {currentStroke && (
            <path
              d={`M ${currentStroke.points.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke={currentStroke.color}
              strokeWidth={currentStroke.width}
              strokeDasharray={currentStroke.dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Sticky notes */}
        <AnimatePresence>
          {notes.map(note => (
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

        {/* Ruler (lives on the surface so it scales with zoom) */}
        {showRuler && (
          <Ruler
            transform={rulerTransform}
            onUpdate={setRulerTransform}
            zoom={transform.scale}
          />
        )}
      </div>
    </div>
  );
};

export default Canvas;
