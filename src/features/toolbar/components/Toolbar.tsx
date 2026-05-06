import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Plus, Maximize, Minus, Download, Undo2, Redo2,
  Pencil, Eraser, Ruler as RulerIcon, Trash2, ImagePlus, Loader2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useUIStore } from '../../../store/useUIStore';
import { useBoardStore } from '../../../store/useBoardStore';
import { useViewStore } from '../../../store/useViewStore';
import { uploadImageToCloudinary } from '../../../api/cloudinary.service';
import { randomId } from '../../../lib/math';
import type { BoardImage } from '../../../core/types';
import { useCreateElement } from '../../../hooks/queries/useBoardQueries';

import Tooltip from '../../../shared/ui/Tooltip';
import BrushPanel from '../../properties/components/BrushPanel';
import EraserPanel from '../../properties/components/EraserPanel';

const Toolbar: React.FC = () => {
  const appMode = useUIStore(s => s.appMode);
  const setAppMode = useUIStore(s => s.setAppMode);
  const toggleRuler = useUIStore(s => s.toggleRuler);
  const showRuler = useUIStore(s => s.showRuler);

  const transform = useViewStore(s => s.transform);
  const zoomBy = useViewStore(s => s.zoomBy);

  const addNote = useBoardStore(s => s.addNote);
  const addImage = useBoardStore(s => s.addImage);
  const authorName = useBoardStore(s => s.authorName);
  const undo = useBoardStore(s => s.undo);
  const redo = useBoardStore(s => s.redo);
  const clearAll = useBoardStore(s => s.clearAll);
  const historyLen = useBoardStore(s => s.history.length);
  const redoLen = useBoardStore(s => s.redoStack.length);
  const boardId = useBoardStore(s => s.boardId);

  const { mutate: createElement } = useCreateElement();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageToolClick = () => {
    setAppMode('select'); // revert mode; image upload is a one-shot action
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadImageToCloudinary(file);

      const MAX_W = 600; // max canvas-space width
      const aspectRatio = result.height / result.width;
      const canvasW = Math.min(result.width, MAX_W);
      const canvasH = canvasW * aspectRatio;

      const centerX = (-transform.x + window.innerWidth  / 2) / transform.scale - canvasW / 2;
      const centerY = (-transform.y + window.innerHeight / 2) / transform.scale - canvasH / 2;

      const image: BoardImage = {
        id:     randomId(),
        x:      centerX,
        y:      centerY,
        width:  canvasW,
        height: canvasH,
        url:    result.secureUrl,
        rotation: Math.random() * 6 - 3,
        originalWidth: canvasW,
        originalHeight: canvasH,
        author: authorName ?? undefined,
      };

      const addedImage = addImage(image);
      if (boardId) {
        createElement({ boardId, elementType: 'image', data: addedImage, author: authorName || 'Guest' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
      console.error('Image upload error:', err);

      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async () => {
    const surface = document.getElementById('canvas-surface');
    if (!surface) return;
    try {
      const url = await toPng(surface as HTMLElement, {
        backgroundColor: '#FDFCF0',
        quality: 1,
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.download = `mura-${new Date().toISOString()}.png`;
      a.href = url;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all drawings and notes?')) clearAll();
  };

  const handleAddNote = () => {
    const note = addNote(transform);
    if (boardId) {
      createElement({ boardId, elementType: 'note', data: note, author: authorName || 'Guest' });
    }
  };

  return (
    <>
      {}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {}
      <AnimatePresence>
        {(isUploading || uploadError) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl z-50 text-sm font-semibold"
            style={{
              background: uploadError ? '#fee2e2' : '#1c1917',
              color:      uploadError ? '#991b1b'  : '#fff',
              border:     uploadError ? '1px solid #fca5a5' : '1px solid #292524',
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading to Cloudinary…</span>
              </>
            ) : (
              <>
                <span>⚠</span>
                <span>{uploadError}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {appMode === 'pen' && <BrushPanel />}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {appMode === 'eraser' && <EraserPanel />}
      </AnimatePresence>

      {}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-5 px-6 py-3 bg-white border border-black/5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.05)] z-50">
        <div className="flex gap-2">
          {}
          {([
            { mode: 'select' as const, label: 'Selection Tool', Icon: () => <Maximize className="w-4 h-4 rotate-45" /> },
            { mode: 'pen'    as const, label: 'Pen Tool',       Icon: () => <Pencil  className="w-4 h-4" /> },
            { mode: 'eraser' as const, label: 'Eraser Tool',    Icon: () => <Eraser  className="w-4 h-4" /> },
          ]).map(({ mode, label, Icon }) => (
            <Tooltip key={mode} content={label}>
              <button
                id={`tool-${mode}`}
                onClick={() => setAppMode(mode)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all ${
                  appMode === mode
                    ? 'bg-stone-900 text-white -translate-y-0.5'
                    : 'bg-canvas text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon />
              </button>
            </Tooltip>
          ))}

          <Tooltip content="Ruler Tool">
            <button
              id="tool-ruler"
              onClick={toggleRuler}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all ${
                showRuler
                  ? 'bg-stone-900 text-white -translate-y-0.5'
                  : 'bg-canvas text-stone-900 hover:bg-stone-100'
              }`}
            >
              <RulerIcon className="w-4 h-4" />
            </button>
          </Tooltip>

          {}
          <Tooltip content="Upload Image">
            <button
              id="tool-image"
              onClick={handleImageToolClick}
              disabled={isUploading}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all bg-canvas text-stone-900 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-wait"
            >
              {isUploading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ImagePlus className="w-4 h-4" />
              }
            </button>
          </Tooltip>

          <Tooltip content="Add Sticky Note">
            <button id="action-add-note" onClick={handleAddNote} className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer group">
              <Plus className="w-5 h-5 text-stone-900 group-active:scale-90 transition-transform" />
            </button>
          </Tooltip>

          <Tooltip content="Undo Action">
            <button id="action-undo" onClick={undo} disabled={historyLen === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
              <Undo2 className="w-4 h-4 text-stone-900" />
            </button>
          </Tooltip>

          <Tooltip content="Redo Action">
            <button id="action-redo" onClick={redo} disabled={redoLen === 0}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
              <Redo2 className="w-4 h-4 text-stone-900" />
            </button>
          </Tooltip>

          <Tooltip content="Export as PNG">
            <button id="action-export" onClick={handleExport} className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer text-stone-900">
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Clear Canvas">
            <button id="action-clear" onClick={handleClear} className="w-10 h-10 rounded-full flex items-center justify-center bg-canvas border border-stone-200 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer text-stone-400 hover:text-red-500">
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

      {}
      <div className="absolute bottom-8 right-8 flex flex-col bg-white border border-stone-100 rounded-lg shadow-sm overflow-hidden z-50">
        <Tooltip content="Current Zoom" position="left">
          <div className="px-3 py-2 text-[12px] font-bold text-center border-b border-stone-100 min-w-[50px] cursor-default">
            {Math.round(transform.scale * 100)}%
          </div>
        </Tooltip>
        <Tooltip content="Zoom In" position="left">
          <button id="zoom-in" onClick={() => zoomBy(0.1)} className="p-2.5 hover:bg-stone-50 text-stone-600 transition-colors w-full flex justify-center">
            <Plus className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Zoom Out" position="left">
          <button id="zoom-out" onClick={() => zoomBy(-0.1)} className="p-2.5 hover:bg-stone-50 text-stone-600 transition-colors border-t border-stone-50 w-full flex justify-center">
            <Minus className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </>
  );
};

export default Toolbar;
