'use client';

import { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  isCircle: boolean;
  rotation: number;
}

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

const colors = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

export default function Confetti({ isActive, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Asegurar que solo se renderice en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (isActive && isMounted) {
      // Generar piezas de confeti solo en el cliente
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 150; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 2,
          size: 8 + Math.random() * 8,
          isCircle: Math.random() > 0.5,
          rotation: Math.random() * 360,
        });
      }
      setPieces(newPieces);
      setShowCelebration(true);

      // Limpiar después de la animación
      const timer = setTimeout(() => {
        setPieces([]);
        setShowCelebration(false);
        handleComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isActive, isMounted, handleComplete]);

  // No renderizar en el servidor o si no está activo
  if (!isMounted || (!isActive && pieces.length === 0)) return null;

  return (
    <>
      {/* Confetti Container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              top: '-20px',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              borderRadius: piece.isCircle ? '50%' : '2px',
              transform: `rotate(${piece.rotation}deg)`,
            }}
          />
        ))}
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="animate-celebration-pop bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mx-4 max-w-sm text-center pointer-events-auto">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Felicitaciones!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Has completado todas las subtareas de esta tarea. ¡Excelente trabajo!
            </p>
            <div className="flex justify-center gap-2">
              <span className="text-2xl animate-pulse">⭐</span>
              <span className="text-2xl animate-pulse" style={{ animationDelay: '0.1s' }}>⭐</span>
              <span className="text-2xl animate-pulse" style={{ animationDelay: '0.2s' }}>⭐</span>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes celebration-pop {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
        
        .animate-celebration-pop {
          animation: celebration-pop 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}
