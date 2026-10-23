import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Modal, Pressable,
  Vibration, Easing, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeProvider';
import {
  SOSButtonMode, getSOSButtonMode, setSOSButtonMode, onSOSButtonModeChange,
  SOSButtonPosition, getSOSButtonPosition, setSOSButtonPosition,
} from '../utils/sosButton';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const BTN = 56;
const EDGE = 12;
const HOLD_MS = 2000;
const DRAG_START = 8;
const ZONE_W = 190;
const ZONE_H = 56;

const SOS_TYPES: { label: string; value: string; icon: IconName; color: string }[] = [
  { label: 'Medical', value: 'Medical Emergency', icon: 'medkit', color: '#F87171' },
  { label: 'Fire', value: 'Fire', icon: 'flame', color: '#FB923C' },
  { label: 'Harassment', value: 'Harassment', icon: 'shield', color: '#B9A8FF' },
  { label: 'Other', value: 'Other', icon: 'ellipsis-horizontal', color: '#4F7CFF' },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

type Props = {
  enabled: boolean;      // false while the keyboard is open or on the SOS screen
  chatContext: boolean;  // true on chat screens (the button collapses to a side handle)
  tabBarHeight: number;  // full height of the tab bar including the bottom inset
};

export default function FloatingSOS({ enabled, chatContext, tabBarHeight }: Props) {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const rootNav = useNavigation<any>();

  const [mode, setMode] = useState<SOSButtonMode>('visible');
  const [pos, setPos] = useState<SOSButtonPosition | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overZone, setOverZone] = useState(false);

  const minTop = insets.top + 8;
  const maxTop = Math.max(minTop, H - tabBarHeight - BTN - 8);
  const defaultTop = clamp(H - tabBarHeight - BTN - 14, minTop, maxTop);

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cur = useRef({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const overZoneRef = useRef(false);
  const holdAnim = useRef(new Animated.Value(0)).current;
  const holdRunning = useRef<Animated.CompositeAnimation | null>(null);
  const live = useRef({ W, H, minTop, maxTop, tabBarHeight, openSheet: () => {} });
  live.current = { W, H, minTop, maxTop, tabBarHeight, openSheet: () => setSheetOpen(true) };

  // Track the button's current position while it moves
  useEffect(() => {
    const id = pan.addListener((v) => {
      cur.current = { x: v.x, y: v.y };
    });
    return () => pan.removeListener(id);
  }, []);

  // Load the saved mode and position
  useEffect(() => {
    getSOSButtonMode().then(setMode);
    getSOSButtonPosition().then((saved) => setPos(saved ?? { side: 'right', top: null }));
    return onSOSButtonModeChange(setMode);
  }, []);

  // Place the button (also runs again if the screen size changes)
  const resolvedX = pos?.side === 'left' ? EDGE : W - BTN - EDGE;
  const resolvedTop = pos && pos.top !== null ? clamp(pos.top, minTop, maxTop) : defaultTop;
  useEffect(() => {
    if (!draggingRef.current) pan.setValue({ x: resolvedX, y: resolvedTop });
  }, [resolvedX, resolvedTop]);

  const startHold = () => {
    holdAnim.setValue(0);
    const anim = Animated.timing(holdAnim, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    holdRunning.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        holdRunning.current = null;
        Vibration.vibrate(80);
        live.current.openSheet();
        holdAnim.setValue(0);
      }
    });
  };

  const cancelHold = () => {
    if (holdRunning.current) {
      holdRunning.current.stop();
      holdRunning.current = null;
    }
    Animated.timing(holdAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  };

  const inDropZone = (cx: number, cy: number) => {
    const L = live.current;
    const left = (L.W - ZONE_W) / 2;
    const top = L.H - L.tabBarHeight - ZONE_H - 24;
    return cx >= left - 20 && cx <= left + ZONE_W + 20 && cy >= top - 30 && cy <= top + ZONE_H + 30;
  };

  const finishDrag = () => {
    cancelHold();
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const wasOverZone = overZoneRef.current;
    overZoneRef.current = false;
    setDragging(false);
    setOverZone(false);

    const L = live.current;
    const centerX = cur.current.x + BTN / 2;
    const side: 'left' | 'right' = centerX < L.W / 2 ? 'left' : 'right';
    const top = cur.current.y;
    const targetX = side === 'left' ? EDGE : L.W - BTN - EDGE;
    const saved: SOSButtonPosition = { side, top };
    setSOSButtonPosition(saved);

    if (wasOverZone) {
      pan.setValue({ x: targetX, y: top });
      setPos(saved);
      setSOSButtonMode('tucked');
      return;
    }
    Animated.spring(pan, {
      toValue: { x: targetX, y: top },
      useNativeDriver: false,
      friction: 7,
      tension: 80,
    }).start(() => setPos(saved));
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        draggingRef.current = false;
        start.current = { ...cur.current };
        startHold();
      },
      onPanResponderMove: (_e, g) => {
        const L = live.current;
        if (!draggingRef.current) {
          if (Math.abs(g.dx) < DRAG_START && Math.abs(g.dy) < DRAG_START) return;
          draggingRef.current = true;
          cancelHold();
          setDragging(true);
        }
        const nx = clamp(start.current.x + g.dx, 0, L.W - BTN);
        const ny = clamp(start.current.y + g.dy, L.minTop, L.maxTop);
        pan.setValue({ x: nx, y: ny });
        const inZone = inDropZone(nx + BTN / 2, ny + BTN / 2);
        if (inZone !== overZoneRef.current) {
          overZoneRef.current = inZone;
          setOverZone(inZone);
          if (inZone) Vibration.vibrate(20);
        }
      },
      onPanResponderRelease: () => finishDrag(),
      onPanResponderTerminate: () => finishDrag(),
    })
  ).current;

  const choose = (value: string) => {
    setSheetOpen(false);
    rootNav.navigate('Main', {
      screen: 'SOS',
      params: {
        screen: 'SOSMain',
        params: { autoSend: true, alertType: value, nonce: Date.now() },
      },
    });
  };

  const sheet = (
    <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
      <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            { backgroundColor: Colors.card, borderColor: Colors.border, paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: Colors.border }]} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text }}>What is the emergency?</Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18 }}>
            A 5 second countdown starts after you choose. You can cancel it. Students on your campus
            will see the alert.
          </Text>
          <View style={styles.grid}>
            {SOS_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.tile, { backgroundColor: Colors.bg, borderColor: Colors.border }]}
                onPress={() => choose(t.value)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t.label}
              >
                <View style={[styles.tileIcon, { backgroundColor: t.color + '2E' }]}>
                  <Ionicons name={t.icon} size={22} color={t.color} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.cancel} onPress={() => setSheetOpen(false)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textMuted }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (!enabled || mode === 'hidden' || !pos) return null;

  // Collapsed to a side handle: either tucked by the user, or automatically on chat screens
  if (mode === 'tucked' || chatContext) {
    const side = pos.side;
    const handleTop = chatContext ? Math.round(H * 0.42) : resolvedTop + 2;
    return (
      <>
        <TouchableOpacity
          style={[styles.handle, side === 'left' ? styles.handleLeft : styles.handleRight, { top: handleTop }]}
          onPress={() => (chatContext ? setSheetOpen(true) : setSOSButtonMode('visible'))}
          hitSlop={{ top: 12, bottom: 12, left: side === 'right' ? 16 : 0, right: side === 'left' ? 16 : 0 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={chatContext ? 'Open SOS emergency' : 'Show SOS button'}
        >
          <Ionicons
            name={chatContext ? 'warning' : side === 'left' ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color="#FECACA"
          />
        </TouchableOpacity>
        {sheet}
      </>
    );
  }

  return (
    <>
      {dragging && (
        <View
          pointerEvents="none"
          style={[
            styles.zone,
            overZone && styles.zoneOn,
            { left: (W - ZONE_W) / 2, top: H - tabBarHeight - ZONE_H - 24, width: ZONE_W, height: ZONE_H },
          ]}
        >
          <Ionicons name="eye-off" size={18} color="#F1F5F9" />
          <Text style={styles.zoneText}>{overZone ? 'Release to hide' : 'Drop to hide'}</Text>
        </View>
      )}

      <Animated.View
        {...responder.panHandlers}
        style={[styles.btn, { transform: pan.getTranslateTransform() }]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="SOS emergency"
        accessibilityHint="Hold for two seconds to send an alert. Drag to move it, or drop it on the hide area."
        accessibilityActions={[{ name: 'activate', label: 'Open SOS emergency options' }]}
        onAccessibilityAction={() => setSheetOpen(true)}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.fill,
            { transform: [{ scale: holdAnim.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] }) }] },
          ]}
        />
        <Ionicons name="warning" size={20} color="#FEE2E2" />
        <Text style={styles.label}>SOS</Text>
      </Animated.View>
      {sheet}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(220,38,38,0.20)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  fill: { backgroundColor: '#DC2626', borderRadius: BTN / 2 },
  label: { color: '#FEE2E2', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: -1 },
  handle: {
    position: 'absolute',
    width: 22,
    height: 52,
    backgroundColor: 'rgba(220,38,38,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  handleRight: { right: 0, borderTopLeftRadius: 26, borderBottomLeftRadius: 26, borderRightWidth: 0 },
  handleLeft: { left: 0, borderTopRightRadius: 26, borderBottomRightRadius: 26, borderLeftWidth: 0 },
  zone: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.6)',
    zIndex: 998,
  },
  zoneOn: { backgroundColor: 'rgba(220,38,38,0.45)', borderColor: '#F87171' },
  zoneText: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(5,8,15,0.7)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 18 },
  tile: { width: '48%', minHeight: 92, borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancel: { alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 8 },
});