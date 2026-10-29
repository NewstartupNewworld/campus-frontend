import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleProp, TextInputProps, TextStyle, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeProvider';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'style'> & {
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * A password box with an eye button to show or hide what you typed.
 * Use it exactly like <TextInput>, it takes the same props and style.
 */
export default function PasswordInput({ style, containerStyle, ...rest }: Props) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  return (
    <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center' }, containerStyle]}>
      <TextInput
        {...rest}
        style={[style, { flex: 1 }]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        style={{ paddingLeft: 8, paddingVertical: 6 }}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}