// src/components/EventStatusBadge.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Text from './Text';
import { moderateScale } from '../utils/responsiveUtils';

interface EventStatusBadgeProps {
  status: 'upcoming' | 'live' | 'completed';
  large?: boolean;
}

const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ status, large = false }) => {
  const { colors } = useTheme();
  
  // Determine badge styling based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'upcoming':
        return {
          backgroundColor: `${colors.primary}20`,
          textColor: colors.primary,
          label: 'Upcoming'
        };
      case 'live':
        return {
          backgroundColor: `${colors.error}20`,
          textColor: colors.error,
          label: 'Live Now'
        };
      case 'completed':
        return {
          backgroundColor: `${colors.textSecondary}20`,
          textColor: colors.textSecondary,
          label: 'Completed'
        };
      default:
        return {
          backgroundColor: `${colors.textSecondary}20`,
          textColor: colors.textSecondary,
          label: 'Unknown'
        };
    }
  };
  
  const statusStyles = getStatusStyles();
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor: statusStyles.backgroundColor },
      large && styles.largeBadge
    ]}>
      {status === 'live' && (
        <View style={[styles.liveIndicator, { backgroundColor: colors.error }]} />
      )}
      <Text 
        variant={large ? "labelMedium" : "labelSmall"} 
        color={statusStyles.textColor}
      >
        {statusStyles.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  }
});

export default EventStatusBadge;
