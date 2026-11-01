import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardEvent, LayoutChangeEvent, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// True inside <KeyboardPadProvider>. Screens there are lifted above the keyboard by the provider,
// so their own hook must not add the same space a second time.
const HandledContext = createContext(false);

function useKeyboardCore() {
  const insets = useSafeAreaInsets();
  // On Android the keyboard position is reported higher by the height of the navigation bar,
  // so that height is added back to get the real space the keyboard covers.
  const bottomInset = useRef(0);
  bottomInset.current = insets.bottom;

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
      setPad(overlap > 1 ? Math.round(overlap + bottomInset.current) : 0);
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

/**
 * Keeps the bottom of a screen above the keyboard.
 * Put `ref={rootRef} collapsable={false} onLayout={onLayout}` on the outer View and
 * `paddingBottom: pad` on the View inside it that holds the whole screen.
 *
 * Inside the main app the padding is already added once for every screen, so this returns 0 there.
 * Pop-up sheets (Modal) are separate windows, so they must call useKeyboardPadding({ modal: true }).
 */
export function useKeyboardPadding(options?: { modal?: boolean }) {
  const handled = useContext(HandledContext);
  const core = useKeyboardCore();
  const idleRef = useRef<View>(null);
  const idleLayout = useCallback((_e: LayoutChangeEvent) => {}, []);
  if (handled && !options?.modal) {
    return { rootRef: idleRef, onLayout: idleLayout, pad: 0 };
  }
  return core;
}

/** Wraps the whole main app so every screen and form rises above the keyboard. */
export function KeyboardPadProvider({ children }: { children: React.ReactNode }) {
  const { rootRef, onLayout, pad } = useKeyboardCore();
  return React.createElement(
    HandledContext.Provider,
    { value: true },
    React.createElement(
      View,
      { ref: rootRef, collapsable: false, onLayout, style: { flex: 1, paddingBottom: pad } },
      children
    )
  );
}