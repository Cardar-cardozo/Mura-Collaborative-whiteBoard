import React from 'react';
import { motion } from 'motion/react';
import { useUIStore } from '../../../store/useUIStore';
import { ERASER_SIZES, ERASER_SHAPES } from '../../../core/constants';

const EraserPanel: React.FC = () => {
  // Separate selectors — avoid inline object literals that cause getSnapshot loops
  const eraserSettings    = useUIStore(s => s.eraserSettings);
  const setEraserSettings = useUIStore(s => s.setEraserSettings);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-4 p-4 bg-white border border-black/5 rounded-2xl shadow-xl z-50 min-w-[280px]"
    >
      {/* Size picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Eraser Size</span>
        <div className="flex items-center gap-4">
          {ERASER_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setEraserSettings({ size: s })}
              className={`flex items-center justify-center p-1 rounded-lg transition-all ${
                eraserSettings.size === s ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div
                className={`border-2 border-current ${eraserSettings.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                style={{ width: Math.max(6, s / 8), height: Math.max(6, s / 8) }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Shape picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Eraser Shape</span>
        <div className="flex gap-2">
          {ERASER_SHAPES.map(shape => (
            <button
              key={shape}
              onClick={() => setEraserSettings({ shape })}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                eraserSettings.shape === shape
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EraserPanel;
