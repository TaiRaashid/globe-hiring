import { useRef } from "react";

export function useSwipeDown(onClose: () => void, threshold = 80) {
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null) return;

    const diff = e.touches[0].clientY - startY.current;
    if (diff > threshold) {
      startY.current = null;
      onClose();
    }
  }

  function onTouchEnd() {
    startY.current = null;
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
