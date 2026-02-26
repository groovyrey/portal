'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Download, RotateCcw } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onDownload?: () => void;
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  onDownload
}: ImagePreviewModalProps) {
  const [scale, setScale] = useState(1);
  const controls = useAnimation();
  const lastDist = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      lastDist.current = 0;
      controls.set({ x: 0, y: 0, scale: 1 });
    }
  }, [isOpen, controls]);

  const handleReset = async () => {
    setScale(1);
    await controls.start({ 
      x: 0, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 5);
    setScale(newScale);
    controls.set({ scale: newScale });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      lastDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      
      if (lastDist.current > 0) {
        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
          const delta = dist / lastDist.current;
          const newScale = Math.min(Math.max(scale * delta, 0.5), 5);
          setScale(newScale);
          controls.set({ scale: newScale });
          lastDist.current = dist;
          rafRef.current = null;
        });
      }
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 touch-none overflow-hidden"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Close Button - Top Right */}
            <div className="absolute top-6 right-6 z-[1010] pointer-events-auto">
              <button
                onClick={onClose}
                className="p-3 bg-black/40 hover:bg-red-500/40 text-white rounded-2xl border border-white/10 backdrop-blur-xl transition-all shadow-2xl"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Container */}
            <div className="w-full h-full flex items-center justify-center pointer-events-auto p-4 sm:p-20 overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.img
                  src={imageUrl}
                  alt="Preview"
                  animate={controls}
                  drag={scale > 1}
                  dragConstraints={{ 
                    left: -200 * (scale - 1), 
                    right: 200 * (scale - 1), 
                    top: -200 * (scale - 1), 
                    bottom: 200 * (scale - 1) 
                  }}
                  dragElastic={0.05}
                  dragMomentum={false}
                  decoding="async"
                  className={`max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-lg transition-shadow will-change-transform ${scale > 1 ? 'cursor-move' : 'cursor-default'}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                />
              </div>
            </div>

            {/* Toolbar - Bottom Center */}
            {(scale !== 1 || onDownload) && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xl p-2 rounded-[2rem] border border-white/10 pointer-events-auto z-[1010] shadow-2xl">
                <div className="px-4 py-1.5 min-w-[60px] text-center border-r border-white/10">
                  <span className="text-[10px] font-black text-white/90 tracking-widest uppercase">
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                <button
                  onClick={handleReset}
                  className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center gap-2"
                  title="Reset"
                >
                  <RotateCcw size={20} />
                  <span className="text-[9px] font-bold uppercase tracking-wider pr-1">Reset</span>
                </button>

                {onDownload && (
                  <>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button
                      onClick={onDownload}
                      className="p-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full transition-all"
                      title="Download"
                    >
                      <Download size={20} />
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Gesture Hint for Mobile */}
            {scale === 1 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/30 text-[9px] font-black uppercase tracking-[0.3em] pointer-events-none sm:hidden">
                Pinch to Zoom
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
