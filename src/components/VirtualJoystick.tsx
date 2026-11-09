import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (input: { x: number; y: number }) => void;
  sensitivity?: number;
  isFloating?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  sensitivity = 1.0,
  isFloating = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [basePos, setBasePos] = useState({ x: 100, y: 100 });
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const radius = 55;

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;

      const touch = e.changedTouches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      touchIdRef.current = touch.identifier;
      setActive(true);

      if (isFloating) {
        setBasePos({ x, y });
        setKnobPos({ x: 0, y: 0 });
      } else {
        const dx = x - basePos.x;
        const dy = y - basePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(dy, dx);
        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;

        setKnobPos({ x: kx, y: ky });
        const normDist = clampedDist / radius;
        onMove({
          x: Math.cos(angle) * normDist * sensitivity,
          y: Math.sin(angle) * normDist * sensitivity,
        });
      }
    },
    [basePos, isFloating, onMove, radius, sensitivity]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (touchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;

          const touchX = touch.clientX - rect.left;
          const touchY = touch.clientY - rect.top;

          const dx = touchX - basePos.x;
          const dy = touchY - basePos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const clampedDist = Math.min(dist, radius);
          const angle = Math.atan2(dy, dx);

          const kx = Math.cos(angle) * clampedDist;
          const ky = Math.sin(angle) * clampedDist;
          setKnobPos({ x: kx, y: ky });

          const normDist = clampedDist / radius;
          onMove({
            x: Math.cos(angle) * normDist * sensitivity,
            y: Math.sin(angle) * normDist * sensitivity,
          });
          break;
        }
      }
    },
    [basePos, onMove, radius, sensitivity]
  );

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
        break;
      }
    }
  }, [onMove]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 w-1/2 h-3/5 z-20 touch-none pointer-events-auto"
    >
      {(active || !isFloating) && (
        <div
          className="absolute rounded-full pointer-events-none transition-opacity duration-200"
          style={{
            left: `${basePos.x - radius}px`,
            top: `${basePos.y - radius}px`,
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
            border: '2px solid rgba(56, 189, 248, 0.4)',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)',
          }}
        >
          {/* Knob */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${radius - 24 + knobPos.x}px`,
              top: `${radius - 24 + knobPos.y}px`,
              width: '48px',
              height: '48px',
              background: 'radial-gradient(circle, #38bdf8 0%, #0284c7 100%)',
              border: '2px solid #ffffff',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.8)',
            }}
          />
        </div>
      )}
    </div>
  );
};
