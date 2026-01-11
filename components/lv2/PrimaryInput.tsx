import { theme } from '@/theme/theme';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

export function PrimaryInput({
  style,
  placeholderTextColor = theme.placeholderColor,
  ...rest
}: TextInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.textColor,
    backgroundColor: theme.bgColor,
  },
});
