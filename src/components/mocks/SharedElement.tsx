import React from 'react';
import { View, ViewStyle } from 'react-native';

interface SharedElementProps {
  children: React.ReactNode;
  id: string;
  style?: ViewStyle | ViewStyle[];
}

// Mock SharedElement component that just renders children in a View
export const SharedElement: React.FC<SharedElementProps> = ({ children, id, style = {} }) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};
