import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, LayoutChangeEvent, View } from 'react-native';

/**
 * Keeps the bottom of a screen above the keyboard on every Android version.
 * Put `ref={rootRef} collapsable={false} onLayout={onLayout}` on the outer View,
 * and `paddingBottom: pad` on the View inside it that holds the whole screen.
 * It measures how much the keyboard really covers, so it never adds the space twice.
 */
export function useKeyboardPadding() {
  const rootRef = useRef<View>(null);
  const keyboardTop = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [pad, setPad] = useState(0);

  const recalc = useCallback(() => {
    const top = keyboardTop.current;
    if (top === null) {
      setPad(0);
      return;
    }
    rootRef.current?.measureInWindow((_x, y, _w, h) => {
      const overlap = y + h - top;
      setPad(overlap > 1 ? Math.round(overlap) : 0);
    });
  }, []);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    const show = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => {
      keyboardTop.current = e.endCoordinates.screenY;
      clearTimers();
      [0, 120, 350].forEach((ms) => timers.current.push(setTimeout(recalc, ms)));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTop.current = null;
      clearTimers();
      setPad(0);
    });
    return () => {
      show.remove();
      hide.remove();
      clearTimers();
    };
  }, [recalc]);

  const onLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      if (keyboardTop.current !== null) recalc();
    },
    [recalc]
  );

  return { rootRef, onLayout, pad };
}