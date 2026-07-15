import React, { useState, useRef } from "react";

export default function ZoomableImage({ src, alt }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  // Interaction variables
  const isDragging = useRef(false);
  const startCoords = useRef({ x: 0, y: 0 });
  const initialTouchDistance = useRef(0);
  const initialScaleOnPinch = useRef(1);
  const lastTapTime = useRef(0);

  const handleStart = (clientX, clientY) => {
    if (scale > 1) {
      isDragging.current = true;
      startCoords.current = { x: clientX - position.x, y: clientY - position.y };
    }
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging.current || scale <= 1) return;
    const newX = clientX - startCoords.current.x;
    const newY = clientY - startCoords.current.y;
    
    // Clamp coordinates to prevent dragging too far out
    const maxDragX = (scale - 1) * 80;
    const maxDragY = (scale - 1) * 100;
    const clampedX = Math.max(-maxDragX, Math.min(maxDragX, newX));
    const clampedY = Math.max(-maxDragY, Math.min(maxDragY, newY));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Double tap check
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Toggle Zoom
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
      }
      lastTapTime.current = now;

      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialTouchDistance.current = dist;
      initialScaleOnPinch.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialTouchDistance.current;
      const targetScale = Math.max(1, Math.min(4, initialScaleOnPinch.current * factor));
      setScale(targetScale);
      if (targetScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      handleEnd();
    }
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    // Double click detection
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    }
    lastTapTime.current = now;

    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden w-full aspect-[4/3] bg-slate-100 flex items-center justify-center cursor-grab active:cursor-grabbing select-none rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-75 origin-center pointer-events-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
      />
      {scale > 1 && (
        <span className="absolute bottom-2 right-3 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
          Scale: {scale.toFixed(1)}x
        </span>
      )}
    </div>
  );
}
