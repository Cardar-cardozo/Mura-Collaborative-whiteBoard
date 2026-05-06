import React, { useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { RULER_TICK_COUNT } from '../../core/constants';

const Ruler: React.FC = () => {
  const rulerRef = useRef<HTMLDivElement>(null);

  const x      = useMotionValue(140);
  const y      = useMotionValue(140);
  const rotate = useMotionValue(0);

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    const startAngle  = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const startRotate = rotate.get();

    const onMove = (me: MouseEvent) => {
      const current = Math.atan2(me.clientY - cy, me.clientX - cx) * (180 / Math.PI);
      rotate.set(startRotate + (current - startAngle));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  return (
    <motion.div
      ref={rulerRef}
      drag
      dragMomentum={false}

      style={{ x, y, rotate }}
      className="absolute w-[600px] h-16 bg-white/40 backdrop-blur-sm border border-stone-300 rounded-lg shadow-xl cursor-grab active:cursor-grabbing flex items-center px-4 overflow-hidden select-none pointer-events-auto z-[200]"
    >
      {}
      <div className="absolute inset-0 flex items-start pt-1 px-4 gap-[10px]">
        {Array.from({ length: RULER_TICK_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`w-px bg-stone-400 ${
              i % 10 === 0 ? 'h-4' : i % 5 === 0 ? 'h-2.5' : 'h-1.5'
            }`}
          />
        ))}
      </div>

      {}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: RULER_TICK_COUNT + 1 }).map((_, i) =>
          i % 10 === 0 ? (
            <span
              key={i}
              className="absolute top-5 text-[8px] text-stone-400 font-mono"
              style={{ left: `${16 + i * 10}px` }}
            >
              {i}
            </span>
          ) : null
        )}
      </div>

      {}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="text-[40px] font-bold text-stone-900 tracking-[20px] ml-[20px]">RULER</div>
      </div>

      {}
      <div className="ml-auto z-10">
        <button
          onMouseDown={handleRotate}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 bg-stone-900 text-white rounded-full hover:scale-110 transition-transform cursor-alias"
          title="Rotate ruler"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export default Ruler;
