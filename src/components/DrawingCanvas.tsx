import React from 'react';
import { Stroke } from '../types';

interface DrawingCanvasProps {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  transform: { x: number; y: number; scale: number };
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ strokes, currentStroke }) => {
  // We use a massive SVG coordinate space to simulate an infinite canvas.
  // The origin (0,0) is at the center of this huge box.
  const SIZE = 100000;
  const OFFSET = -SIZE / 2;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ 
        width: `${SIZE}px`, 
        height: `${SIZE}px`, 
        top: OFFSET, 
        left: OFFSET 
      }} 
      viewBox={`${OFFSET} ${OFFSET} ${SIZE} ${SIZE}`}
    >
      {/* Render all completed strokes */}
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
          className="transition-opacity duration-200"
        />
      ))}
      
      {/* Render the active stroke currently being drawn */}
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
  );
};

export default DrawingCanvas;
