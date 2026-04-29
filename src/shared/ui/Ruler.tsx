import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { angleToDeg } from '../../lib/math';
import type { RulerTransform } from '../../core/types';
import { RULER_TICK_COUNT } from '../../core/constants';

interface RulerProps {
  transform: RulerTransform;
  onUpdate: (updates: Partial<RulerTransform>) => void;
  zoom: number;
}

const Ruler: React.FC<RulerProps> = ({ transform, onUpdate, zoom }) => {
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const startAngle = angleToDeg(cx, cy, e.clientX, e.clientY);

    const onMove = (me: MouseEvent) => {
      const currentAngle = angleToDeg(cx, cy, me.clientX, me.clientY);
      onUpdate({ rotate: transform.rotate + (currentAngle - startAngle) });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <motion.div
      ref={rulerRef}
      drag
      dragMomentum={false}
      onDrag={(_, info) => onUpdate({
        x: transform.x + info.delta.x / zoom,
        y: transform.y + info.delta.y / zoom,
      })}
      style={{ x: transform.x, y: transform.y, rotate: transform.rotate }}
      className="absolute w-[600px] h-16 bg-white/40 backdrop-blur-sm border border-stone-300 rounded-lg shadow-xl cursor-grab active:cursor-grabbing flex items-center px-4 overflow-hidden select-none pointer-events-auto"
    >
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
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="text-[40px] font-bold text-stone-900 tracking-[20px] ml-[20px]">RULER</div>
      </div>
      <div className="ml-auto z-10">
        <button
          onMouseDown={handleRotate}
          className="p-1.5 bg-stone-900 text-white rounded-full hover:scale-110 transition-transform cursor-alias"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export default Ruler;
