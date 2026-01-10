import { theme } from '@/theme/theme';
import { GestureResponderEvent, Keyboard, StyleProp, StyleSheet, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewProps, ViewStyle } from 'react-native';
import { Typography } from '../lv1/Typography';
import { LoadingSm } from './Loading';

type Props = {
  text: string;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  typographyStyle?: StyleProp<TextStyle>;
  onPress: (event: GestureResponderEvent) => void;
  touchableOpacityProps?: TouchableOpacityProps;
  icon?: React.ReactNode;
  iconStyle?: StyleProp<ViewStyle>;
};

type ButtonProps = Props & ViewProps;

export const PrimaryButton: React.FC<ButtonProps> = (props) => {
  const { text, onPress, loading, disabled, icon, } = props;

  const styles = StyleSheet.create({
    btnWrapper: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: disabled ? theme?.disabledBgColor : theme.primaryColor,
      width: '100%',
      height: 50,
      opacity: disabled ? 0.5 : 1,
      borderRadius: 50,
      marginBottom: 25,
      paddingBottom: 13,
      paddingTop: 13,
      paddingHorizontal: 15,
      ...(props?.style as ViewStyle),
    },
    typography: {
      alignSelf: 'center',
      textAlign: 'center',
      fontSize: 15,
      color: disabled ? theme?.borderColor : theme.textColor,
      ...(props?.typographyStyle) as TextStyle,
    },

    icon: {
      position: 'absolute',
      top: 2,
      left: -38,
      ...(props?.iconStyle as ViewStyle),
    },
  });

  const handlePress = (event: GestureResponderEvent) => {
    Keyboard.dismiss();
    if (disabled || loading) return;
    onPress(event);
  };

  return (
    <TouchableOpacity  onPress={handlePress} style={styles.btnWrapper} {...props.touchableOpacityProps}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        {loading && <LoadingSm color={theme?.bgColor} />}
        {!loading && <Typography type="defaultSemiBold" style={styles.typography}>{text}</Typography>}
      </View>
    </TouchableOpacity>
  );
};
