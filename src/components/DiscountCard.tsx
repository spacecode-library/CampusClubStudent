import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Platform,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Text from './Text';
import { BORDER_RADIUS, SPACING } from '../constants/globalStyles';
import { moderateScale, normalize } from '../utils/responsiveUtils';
import { SaleTagIcon, LocationPinIcon, CalendarIcon } from './NavigationIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Define the discount interface based on your backend model
export interface DiscountData {
  _id: string;
  merchantId: string;
  merchantCity: string;
  merchantCountry: string;
  title: string;
  description: string;
  discountType: string;
  discountpercentage: number;
  startprice?: number;
  remainingUses: number;
  endDate: string | Date;
  isOpenAll: boolean;
  status: string;
  storeLink?: string;
  backgroundImage?: string;
  merchantName?: string; // This will need to be added when fetching the data
  merchantLogo?: string; // This will need to be added when fetching the data
}

interface DiscountCardProps {
  discount: DiscountData;
  onPress: (discount: DiscountData) => void;
  style?: any;
  cardType?: 'featured' | 'regular' | 'minimal';
}

// Default placeholder image if no background image is provided
const defaultBackgroundImage = 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=1470&auto=format&fit=crop';

const DiscountCard: React.FC<DiscountCardProps> = ({
  discount,
  onPress,
  style,
  cardType = 'regular',
}) => {
  const { colors, theme } = useTheme();
  
  // Format end date
  const formatEndDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(discount);
  };

  // Determine if this is an online or offline discount
  const isOnline = discount.discountType === 'ONLINE';

  // Choose layout based on cardType
  if (cardType === 'featured') {
    return (
      <TouchableOpacity
        style={[styles.featuredContainer, style]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <ImageBackground
          source={{ uri: discount.backgroundImage || defaultBackgroundImage }}
          style={styles.featuredBackground}
          imageStyle={styles.featuredBackgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
            style={styles.featuredGradient}
          >
            {/* Discount percentage badge */}
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Text variant="labelLarge" color="#FFFFFF" weight="600">
                {discount.discountpercentage}%
              </Text>
            </View>

            <View style={styles.featuredContent}>
              {/* Merchant logo */}
              {discount.merchantLogo && (
                <Image 
                  source={{ uri: discount.merchantLogo }} 
                  style={styles.merchantLogo} 
                />
              )}

              {/* Title and location */}
              <View style={styles.featuredTextContainer}>
                <Text variant="titleMedium" color="#FFFFFF" weight="600">
                  {discount.title}
                </Text>
                
                <View style={styles.locationContainer}>
                  <LocationPinIcon size={16} color="#FFFFFF" />
                  <Text 
                    variant="labelMedium" 
                    color="#FFFFFF" 
                    style={styles.locationText}
                  >
                    {discount.merchantCity}, {discount.merchantCountry}
                  </Text>
                </View>

                {/* Expiry date */}
                <View style={styles.expiryContainer}>
                  <CalendarIcon size={14} color="#FFFFFF" />
                  <Text 
                    variant="labelSmall" 
                    color="#FFFFFF"
                    style={styles.expiryText}
                  >
                    Expires {formatEndDate(discount.endDate)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  if (cardType === 'minimal') {
    return (
      <TouchableOpacity
        style={[
          styles.minimalContainer,
          { backgroundColor: colors.card },
          style
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.minimalLeftContent}>
          {/* Merchant logo or placeholder */}
          <View 
            style={[
              styles.minimalLogoContainer, 
              { backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary }
            ]}
          >
            {discount.merchantLogo ? (
              <Image 
                source={{ uri: discount.merchantLogo }} 
                style={styles.minimalLogo} 
              />
            ) : (
              <Text variant="titleSmall" color={colors.textSecondary}>
                {discount.merchantName?.charAt(0) || 'S'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.minimalMainContent}>
          <Text 
            variant="labelMedium"
            color={colors.text}
            weight="600"
            numberOfLines={1}
          >
            {discount.title}
          </Text>
          <Text 
            variant="labelSmall"
            color={colors.textSecondary}
            numberOfLines={1}
          >
            {discount.merchantName || 'Store'}
          </Text>
        </View>

        <View style={styles.minimalRightContent}>
          <View style={[styles.minimalDiscountBadge, { backgroundColor: colors.primary }]}>
            <Text variant="labelSmall" color="#FFFFFF" weight="600">
              {discount.discountpercentage}%
            </Text>
          </View>
          <Text 
            variant="labelSmall"
            color={colors.textTertiary}
            style={styles.minimalExpiry}
          >
            Exp. {formatEndDate(discount.endDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Default 'regular' card
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Top section with image */}
      <ImageBackground
        source={{ uri: discount.backgroundImage || defaultBackgroundImage }}
        style={styles.imageBackground}
        imageStyle={styles.imageBackgroundStyle}
      >
        <View style={styles.overlay}>
          {/* Discount percentage badge */}
          <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
            <Text variant="labelLarge" color="#FFFFFF" weight="600">
              {discount.discountpercentage}%
            </Text>
          </View>

          {/* Merchant Logo */}
          {discount.merchantLogo && (
            <Image 
              source={{ uri: discount.merchantLogo }} 
              style={[
                styles.merchantLogoSmall,
                { borderColor: colors.card }
              ]} 
            />
          )}
        </View>
      </ImageBackground>

      {/* Content section */}
      <View style={styles.contentContainer}>
        {/* Title and merchant */}
        <View style={styles.headerContainer}>
          <Text 
            variant="titleSmall" 
            color={colors.text}
            numberOfLines={1}
            style={styles.title}
          >
            {discount.title}
          </Text>
          <Text 
            variant="labelMedium" 
            color={colors.textSecondary}
            numberOfLines={1}
          >
            {discount.merchantName || 'Store'}
          </Text>
        </View>

        {/* Location and discount type */}
        <View style={styles.metaContainer}>
          <View style={styles.locationRow}>
            <LocationPinIcon size={14} color={colors.textSecondary} />
            <Text 
              variant="labelSmall" 
              color={colors.textSecondary}
              numberOfLines={1}
              style={styles.metaText}
            >
              {discount.merchantCity}
            </Text>
          </View>

          <View style={styles.typeContainer}>
            <Text 
              variant="labelSmall" 
              color={isOnline ? colors.info : colors.success}
              style={[
                styles.typeLabel,
                { 
                  backgroundColor: isOnline 
                    ? `${colors.info}15` 
                    : `${colors.success}15` 
                }
              ]}
            >
              {isOnline ? 'Online' : 'In-Store'}
            </Text>
          </View>
        </View>

        {/* Expiry date */}
        <View style={styles.expiryRow}>
          <CalendarIcon size={14} color={colors.textTertiary} />
          <Text 
            variant="labelSmall" 
            color={colors.textTertiary}
            style={styles.metaText}
          >
            Expires {formatEndDate(discount.endDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Regular card styles
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: SPACING.xs,
  },
  imageBackground: {
    height: moderateScale(140),
    width: '100%',
  },
  imageBackgroundStyle: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  overlay: {
    flex: 1,
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  discountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantLogoSmall: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: SPACING.md,
  },
  headerContainer: {
    marginBottom: SPACING.xs,
  },
  title: {
    marginBottom: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
  },
  typeContainer: {},
  typeLabel: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },

  // Featured card styles
  featuredContainer: {
    height: moderateScale(200),
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  featuredBackground: {
    width: '100%',
    height: '100%',
  },
  featuredBackgroundImage: {
    borderRadius: BORDER_RADIUS.lg,
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  merchantLogo: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.sm,
  },
  featuredTextContainer: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  locationText: {
    marginLeft: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  expiryText: {
    marginLeft: 4,
  },

  // Minimal card styles
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.xxs,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  minimalLeftContent: {
    marginRight: SPACING.sm,
  },
  minimalLogoContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimalLogo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  minimalMainContent: {
    flex: 1,
  },
  minimalRightContent: {
    alignItems: 'flex-end',
  },
  minimalDiscountBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 4,
  },
  minimalExpiry: {
    fontSize: normalize(10),
  },
});

export default DiscountCard;