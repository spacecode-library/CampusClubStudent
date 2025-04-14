import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { PlusIcon } from '../components/NavigationIcons';
import Text from '../components/Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';

const { width } = Dimensions.get('window');

interface EmptyStateComponentProps {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
    primaryDark?: string;
    onPrimary?: string;
  };
  searchQuery: string;
  handleCreateEvent: () => void;
  animationSource?: any;
}

const EmptyStateComponent: React.FC<EmptyStateComponentProps> = ({
  colors,
  searchQuery,
  handleCreateEvent,
  animationSource,
}) => {
  return (
    <View style={styles.emptyContentContainer}>
      <LottieView
        source={animationSource || require('../assets/animations/empty-state.json')}
        autoPlay
        loop
        style={styles.emptyStateAnimation}
      />
      
      <Text variant="headingMedium" color={colors.text} style={styles.emptyStateTitle}>
        {searchQuery ? 'No Results Found' : 'No Upcoming Events'}
      </Text>
      
      <Text variant="bodyMedium" color={colors.textSecondary} style={styles.emptyStateDescription}>
        {searchQuery 
          ? 'Try a different search term or check back later.' 
          : 'Check back later for new events or create one yourself!'}
      </Text>
      
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.createEventButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateEvent}
          accessibilityLabel="Create a new event"
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createEventButtonGradient}
          >
            <PlusIcon size={20} color={colors.onPrimary || '#FFFFFF'} />
            <Text variant="labelLarge" color={colors.onPrimary || '#FFFFFF'} style={styles.createEventButtonText}>
              Create Event
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateAnimation: {
    width: moderateScale(180),
    height: moderateScale(180),
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '700',
    fontSize: moderateScale(22),
  },
  emptyStateDescription: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
    maxWidth: '85%',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400',
    opacity: 0.8,
    lineHeight: moderateScale(22),
  },
  createEventButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: width * 0.6,
  },
  createEventButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  createEventButtonText: {
    marginLeft: SPACING.sm,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
    fontSize: moderateScale(16),
  },
});

export default EmptyStateComponent;