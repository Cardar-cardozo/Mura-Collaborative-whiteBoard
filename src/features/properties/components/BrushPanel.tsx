import React from 'react';
import { motion } from 'motion/react';
import { useUIStore } from '../../../store/useUIStore';
import { BRUSH_COLORS, BRUSH_WIDTHS, BRUSH_STYLES } from '../../../core/constants';

const BrushPanel: React.FC = () => {
  // Use separate selectors — a combined object selector returns a new reference
  // on every call, which triggers Zustand's getSnapshot infinite-loop warning.
  const brushSettings    = useUIStore(s => s.brushSettings);
  const setBrushSettings = useUIStore(s => s.setBrushSettings);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col gap-4 p-4 bg-white border border-black/5 rounded-2xl shadow-xl z-50 min-w-[280px]"
    >
      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Brush Color</span>
        <div className="flex gap-2">
          {BRUSH_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setBrushSettings({ color: c })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                brushSettings.color === c ? 'border-stone-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Size picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Brush Size</span>
        <div className="flex items-center gap-4">
          {BRUSH_WIDTHS.map(w => (
            <button
              key={w}
              onClick={() => setBrushSettings({ width: w })}
              className={`flex items-center justify-center rounded-lg transition-all ${
                brushSettings.width === w ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className="rounded-full bg-current" style={{ width: Math.max(2, w / 2), height: Math.max(2, w / 2) }} />
            </button>
          ))}
        </div>
      </div>

      {/* Style picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Line Style</span>
        <div className="flex gap-2">
          {BRUSH_STYLES.map(style => (
            <button
              key={style}
              onClick={() => setBrushSettings({ style })}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                brushSettings.style === style
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default BrushPanel;
