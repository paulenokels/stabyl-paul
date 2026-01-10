import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';


export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Typography type="title">This is a modal</Typography>
      <Link href="/" dismissTo style={styles.link}>
        <Typography type="link">Go to home screen</Typography>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
