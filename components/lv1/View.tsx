import { View as DefaultView, type ViewProps } from 'react-native';

import { theme } from '@/theme/theme';

export function View(props: ViewProps) {
  return <DefaultView style={{ backgroundColor: theme.bgColor }} {...props} />;
}
