import React, { useState } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Trash2, GripHorizontal, Crop, Square } from 'lucide-react';
import type { BoardImage as BoardImageType } from '../../core/types';
import Tooltip from './Tooltip';

interface BoardImageProps {
  image: BoardImageType;
  onUpdate: (id: string, updates: Partial<BoardImageType>) => void;
  onDelete: (id: string) => void;
  zoom: number;
}

const BoardImageComponent: React.FC<BoardImageProps> = ({ image, onUpdate, onDelete, zoom }) => {
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(image.x);
  const y = useMotionValue(image.y);

  React.useEffect(() => {
    x.set(image.x);
    y.set(image.y);
  }, [image.x, image.y, x, y]);

  const startPosRef = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef<number | null>(null);

  const handleDragStart = () => {
    startPosRef.current = { x: image.x, y: image.y };
  };

  const handleDrag = (_: unknown, info: { offset: { x: number; y: number } }) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      onUpdate(image.id, {
        x: startPosRef.current.x + info.offset.x / zoom,
        y: startPosRef.current.y + info.offset.y / zoom,
      });
      rafRef.current = null;
    });
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
    onUpdate(image.id, {
      x: startPosRef.current.x + info.offset.x / zoom,
      y: startPosRef.current.y + info.offset.y / zoom,
    });
  };

  const handleCrop = (ratio: '1:1' | '3:4' | 'original') => {
    const w = image.originalWidth || image.width;
    const h = image.originalHeight || image.height;

    if (ratio === '1:1') {
      onUpdate(image.id, { width: w, height: w, originalWidth: w, originalHeight: h });
    } else if (ratio === '3:4') {
      onUpdate(image.id, { width: w, height: w * (4 / 3), originalWidth: w, originalHeight: h });
    } else {

      onUpdate(image.id, { width: w, height: h, originalWidth: w, originalHeight: h });
    }
  };

  return (
    <motion.div
      style={{
        x,
        y,
        width: image.width + 32, // 16px padding left/right
        height: image.height + 80, // 16px top, 64px bottom
        rotate: image.rotation || 0,
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        borderRadius: '2px',
      }}
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: 1.02, zIndex: 50 }}
      whileTap={{ scale: 0.98, rotate: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="absolute bg-white p-4 pb-16 cursor-grab active:cursor-grabbing select-none group"
    >
      {}
      <div
        className="absolute -top-4 left-1/2 w-24 h-8 bg-white/50 backdrop-blur-sm shadow-sm"
        style={{
          transform: `translateX(-50%) rotate(${image.id.charCodeAt(0) % 2 === 0 ? '-3deg' : '4deg'})`,
        }}
      />

      {}
      <div className="w-full h-full bg-[#1a1a1a] overflow-hidden relative shadow-inner">
        <img
          src={image.url}
          alt="Board image"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      </div>

      {}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        {}
        <div
          className="absolute top-4 left-4 right-4 flex items-center justify-between px-2 py-1.5 pointer-events-auto"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}
        >
          <GripHorizontal className="w-3.5 h-3.5 text-white/70" />

          <div className="flex items-center gap-1">
            <Tooltip content="Square (1:1)" position="top">
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleCrop('1:1'); }}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Portrait (3:4)" position="top">
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleCrop('3:4'); }}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors text-[10px] font-bold"
              >
                3:4
              </button>
            </Tooltip>
            <Tooltip content="Original size" position="top">
              <button
                onPointerDown={(e) => { e.stopPropagation(); handleCrop('original'); }}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <Crop className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            
            <div className="w-px h-3 bg-white/30 mx-1" />

            <Tooltip content="Delete image" position="top">
              <button
                onPointerDown={(e) => { e.stopPropagation(); onDelete(image.id); }}
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded-full hover:bg-red-500/90 text-white/90 hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {}
      {image.author && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-stone-900 bg-stone-100 shadow-sm border border-stone-200"
          >
            {image.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            {image.author}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default BoardImageComponent;
