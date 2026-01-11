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
  variant?: 'primary' | 'secondary' | 'danger';
};

type ButtonProps = Props & ViewProps;

export const Button: React.FC<ButtonProps> = (props) => {
  const { text, onPress, loading, disabled, icon, variant = 'primary' } = props;

  const backgroundColor = variant === 'primary' ? theme.primaryColor : variant === 'secondary' ? theme.bgColor : theme.errorColor;
  const borderColor = variant === 'primary' ? 'transparent' : variant === 'secondary' ? theme.primaryColor : 'transparent';
  const textColor = variant === 'primary' ? theme.bgColor : variant === 'secondary' ? theme.primaryColor : theme.bgColor;
  const styles = StyleSheet.create({
    btnWrapper: {
      flexDirection: 'row',
      flex: 1,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: backgroundColor,
      height: 50,
      opacity: disabled ? 0.5 : 1,
      borderRadius: 10,
      marginBottom: 25,
      paddingBottom: 13,
      paddingTop: 13,
      paddingHorizontal: 15,
      borderWidth: variant === 'primary' ? 0 : 1,
      borderColor: borderColor,
      ...(props?.style as ViewStyle),
    },
    typography: {
      alignSelf: 'center',
      textAlign: 'center',
      fontSize: 15,
      color: textColor,
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
