import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import DiscountCard, { DiscountData } from '../components/DiscountCard';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Icons
import { 
  SearchIcon,
  ArrowLeftIcon,
  FilterIcon,
  CloseIcon,
  LocationPinIcon,
} from '../components/icons';

// API Service
import ApiService from '../services/ApiService';

// Import Loading Skeleton
import Skeleton from '../components/SkeletonLoader';

type ExploreScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Explore'>;

interface ExploreScreenProps {
  navigation: ExploreScreenNavigationProp;
}

// Mock data for categories and merchants
const categories = [
  { id: 'all', name: 'All', icon: '🔍' },
  { id: 'food', name: 'Food & Drinks', icon: '🍔' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'health', name: 'Health', icon: '🏥' },
  { id: 'beauty', name: 'Beauty', icon: '💄' },
];

// Mock data for trending searches
const trendingSearches = [
  'Student discounts', 'Tech deals', 'Coffee shops', 'Textbooks', 'Campus food'
];

// Mock data for nearby merchants
const nearbyMerchants = [
  {
    id: 'merchant-1',
    name: 'Campus Cafe',
    category: 'Food & Drinks',
    location: '0.2 miles away',
    logo: 'https://images.unsplash.com/photo-1553329294-07e4cc131ba6?q=80&w=1374&auto=format&fit=crop',
    discountText: '15% off any purchase',
    rating: 4.7,
  },
  {
    id: 'merchant-2',
    name: 'Tech Haven',
    category: 'Electronics',
    location: '1.5 miles away',
    logo: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1626&auto=format&fit=crop',
    discountText: '20% off accessories',
    rating: 4.5,
  },
  {
    id: 'merchant-3',
    name: 'StyleHub',
    category: 'Fashion',
    location: '0.8 miles away',
    logo: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1374&auto=format&fit=crop',
    discountText: 'Buy 1 Get 1 Free',
    rating: 4.3,
  },
];

// Mock discount data
const mockDiscounts: DiscountData[] = [
  {
    _id: 'discount-1',
    merchantId: 'merchant-1',
    merchantCity: 'Kuala Lumpur',
    merchantCountry: 'Malaysia',
    title: 'Red Chief 50% Off',
    description: 'Get 50% off on all shoes',
    discountType: 'OFFLINE',
    discountpercentage: 50,
    startprice: 2000,
    remainingUses: 100,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Red Chief',
    merchantLogo: 'https://logo.clearbit.com/redchief.com',
    backgroundImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop'
  },
  {
    _id: 'discount-2',
    merchantId: 'merchant-2',
    merchantCity: 'Delhi',
    merchantCountry: 'India',
    title: 'Space Code Clothing Sale',
    description: 'Exclusive discounts for students',
    discountType: 'OFFLINE',
    discountpercentage: 25,
    remainingUses: 50,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Space Code',
    backgroundImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1470&auto=format&fit=crop'
  },
  {
    _id: 'discount-3',
    merchantId: 'merchant-3',
    merchantCity: 'Singapore',
    merchantCountry: 'Singapore',
    title: 'Campus Cafe Breakfast Deal',
    description: 'Student breakfast special',
    discountType: 'OFFLINE',
    discountpercentage: 15,
    remainingUses: 200,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Campus Cafe',
    backgroundImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1470&auto=format&fit=crop'
  },
];

// Screen width for layout calculations
const { width } = Dimensions.get('window');
const cardWidth = width * 0.85;

const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<DiscountData[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // In a real app, fetch from API
        // For demo, use mock data with simulated delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load recent searches from storage
        // In a real app, get this from AsyncStorage
        setRecentSearches(['Pizza', 'Books', 'Shoes', 'Laptop']);
        
        // Set initial search results
        setSearchResults(mockDiscounts);
      } catch (error) {
        console.error('Error loading explore data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setSearchFocused(true)
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // Only unfocus if search is empty
        if (searchQuery.trim() === '') {
          setSearchFocused(false);
        }
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Perform search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Only search if query is not empty
    if (query.trim() !== '') {
      // Simulate search results
      // In a real app, call API
      const results = mockDiscounts.filter(discount => 
        discount.title.toLowerCase().includes(query.toLowerCase()) ||
        discount.merchantName?.toLowerCase().includes(query.toLowerCase()) ||
        discount.description.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(results);
      
      // Add to recent searches if not already there
      if (!recentSearches.includes(query) && query.trim().length > 0) {
        const updatedSearches = [query, ...recentSearches].slice(0, 5);
        setRecentSearches(updatedSearches);
        
        // In a real app, save to AsyncStorage
      }
    } else {
      // Reset to all discounts if query is empty
      setSearchResults(mockDiscounts);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(mockDiscounts);
    setSearchFocused(false);
    Keyboard.dismiss();
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedCategory(categoryId);
    
    // In a real app, filter by category
    // For demo, just set all results
    setSearchResults(mockDiscounts);
  };
  
  // Handle discount press
  const handleDiscountPress = (discount: DiscountData) => {
    navigation.navigate('DiscountDetails', { discountId: discount._id });
  };
  
  // Handle navigate back
  const handleBack = () => {
    if (searchFocused) {
      clearSearch();
    } else {
      navigation.goBack();
    }
  };
  
  // Render category button
  const renderCategoryButton = ({item}: {item: typeof categories[0]}) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.categoryButton,
        selectedCategory === item.id && {
          backgroundColor: 
            theme === 'dark' 
              ? `${colors.primary}30` 
              : `${colors.primary}15`,
          borderColor: colors.primary,
        },
        selectedCategory !== item.id && {
          borderColor: 
            theme === 'dark' 
              ? 'rgba(255,255,255,0.2)' 
              : 'rgba(0,0,0,0.1)',
        },
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text
        variant="labelMedium"
        color={selectedCategory === item.id ? colors.primary : colors.textSecondary}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  // Render discount card
  const renderDiscountCard = ({item, index}: {item: DiscountData, index: number}) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      style={styles.discountCardContainer}
    >
      <DiscountCard
        discount={item}
        onPress={handleDiscountPress}
        cardType="regular"
      />
    </MotiView>
  );
  
  // Render merchant card
  const renderMerchantCard = ({item, index}: {item: typeof nearbyMerchants[0], index: number}) => (
    <MotiView
      style={[
        styles.merchantCard,
        { 
          backgroundColor: colors.card,
          shadowColor: theme === 'dark' ? '#000' : '#888',
        }
      ]}
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
    >
      <Image 
        source={{ uri: item.logo }} 
        style={styles.merchantLogo}
      />
      
      <View style={styles.merchantCardContent}>
        <View style={styles.merchantCardHeader}>
          <View>
            <Text variant="titleMedium" color={colors.text} numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              {item.category}
            </Text>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
            <Text variant="labelMedium" color="#FFFFFF">
              {item.rating}
            </Text>
          </View>
        </View>
        
        <View style={styles.merchantLocation}>
          <LocationPinIcon size={14} color={colors.textSecondary} />
          <Text variant="bodySmall" color={colors.textSecondary} style={{ marginLeft: 4 }}>
            {item.location}
          </Text>
        </View>
        
        <View style={[styles.discountBadge, { backgroundColor: `${colors.primary}15` }]}>
          <Text 
            variant="labelMedium" 
            color={colors.primary}
          >
            {item.discountText}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: colors.primary }]}
        >
          <Text variant="labelMedium" color="#FFFFFF">
            View Offers
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
  
  // Render search suggestions
  const renderSearchSuggestions = () => (
    <View style={styles.searchSuggestionsContainer}>
      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="labelMedium" color={colors.textSecondary}>
              RECENT SEARCHES
            </Text>
            <TouchableOpacity>
              <Text variant="labelSmall" color={colors.primary}>
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentSearches}>
            {recentSearches.map((search, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.recentSearchItem}
                onPress={() => handleSearch(search)}
              >
                <View style={[
                  styles.searchIcon,
                  { backgroundColor: `${colors.primary}15` }
                ]}>
                  <SearchIcon size={14} color={colors.primary} />
                </View>
                <Text variant="bodyMedium" color={colors.text}>
                  {search}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Trending searches */}
      <View style={styles.suggestionsSection}>
        <View style={styles.sectionHeader}>
          <Text variant="labelMedium" color={colors.textSecondary}>
            TRENDING SEARCHES
          </Text>
        </View>
        
        <View style={styles.trendingContainer}>
          {trendingSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.trendingItem,
                { 
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }
              ]}
              onPress={() => handleSearch(search)}
            >
              <Text variant="bodySmall" color={colors.text}>
                {search}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
  
  // Render empty results
  const renderEmptyResults = () => (
    <View style={styles.emptyResultsContainer}>
      <View style={[
        styles.emptyIcon,
        { backgroundColor: `${colors.primary}15` }
      ]}>
        <SearchIcon size={40} color={colors.primary} />
      </View>
      <Text variant="titleMedium" color={colors.text} style={styles.emptyTitle}>
        No Results Found
      </Text>
      <Text variant="bodyMedium" color={colors.textSecondary} style={styles.emptySubtitle}>
        We couldn't find any discounts matching "{searchQuery}". Try a different search term.
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header with Search Bar */}
      <View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.background,
            paddingTop: insets.top,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            {searchFocused ? (
              <CloseIcon size={22} color={colors.text} />
            ) : (
              <ArrowLeftIcon size={22} color={colors.text} />
            )}
          </TouchableOpacity>
          
          <View 
            style={[
              styles.searchContainer, 
              { 
                backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary,
                borderColor: searchFocused ? colors.primary : 'transparent',
                borderWidth: searchFocused ? 1 : 0,
              }
            ]}
          >
            <SearchIcon size={18} color={colors.textSecondary} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for discounts, merchants..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setSearchFocused(true)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <CloseIcon size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <FilterIcon size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Categories Horizontal Scroll - Only show when not searching */}
        {!searchFocused && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            data={categories}
            renderItem={renderCategoryButton}
            keyExtractor={item => item.id}
          />
        )}
      </View>
      
      {/* Main Content */}
      {loading ? (
        // Loading skeletons
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.skeletonContainer}>
            <Skeleton style={[styles.skeletonCard, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
            <Skeleton style={[styles.skeletonCard, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
            <Skeleton style={[styles.skeletonCard, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
          </View>
        </ScrollView>
      ) : searchFocused ? (
        // Search results or suggestions
        <View style={styles.container}>
          {searchQuery.trim() === '' ? (
            // Show search suggestions
            <ScrollView 
              style={styles.container}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderSearchSuggestions()}
            </ScrollView>
          ) : searchResults.length > 0 ? (
            // Show search results
            <FlatList
              style={styles.container}
              contentContainerStyle={styles.scrollContent}
              data={searchResults}
              renderItem={renderDiscountCard}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            // Show empty results state
            <ScrollView 
              style={styles.container}
              contentContainerStyle={[styles.scrollContent, styles.emptyContainer]}
              showsVerticalScrollIndicator={false}
            >
              {renderEmptyResults()}
            </ScrollView>
          )}
        </View>
      ) : (
        // Regular explore view
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Featured Merchants Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" color={colors.text}>
                Featured Merchants
              </Text>
              <TouchableOpacity>
                <Text variant="labelMedium" color={colors.primary}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            
            <FlatList 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.merchantsContainer}
              data={nearbyMerchants}
              renderItem={renderMerchantCard}
              keyExtractor={item => item.id}
              snapToInterval={cardWidth}
              decelerationRate="fast"
            />
          </View>
          
          {/* Recommended Discounts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" color={colors.text}>
                Recommended For You
              </Text>
              <TouchableOpacity>
                <Text variant="labelMedium" color={colors.primary}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.discountsGrid}>
              {searchResults.map((discount, index) => (
                <MotiView
                  key={discount._id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: index * 100 }}
                  style={styles.discountCardContainer}
                >
                  <DiscountCard
                    discount={discount}
                    onPress={handleDiscountPress}
                    cardType="regular"
                  />
                </MotiView>
              ))}
            </View>
          </View>
          
          {/* Map Preview Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" color={colors.text}>
                Near You
              </Text>
              <TouchableOpacity>
                <Text variant="labelMedium" color={colors.primary}>
                  See Map
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.mapPreview,
                { 
                  backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary,
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }
              ]}
            >
              <Text variant="bodyMedium" color={colors.text} style={styles.mapText}>
                View 24 discounts nearby
              </Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Tap to see map view
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom space for navigation */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: 16,
    padding: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  categoriesContainer: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.lg,
  },
  categoryButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginRight: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  merchantsContainer: {
    paddingRight: SPACING.lg,
  },
  merchantCard: {
    width: cardWidth,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: SPACING.md,
  },
  merchantLogo: {
    width: '100%',
    height: moderateScale(120),
    backgroundColor: '#E1E1E1',
  },
  merchantCardContent: {
    padding: SPACING.md,
  },
  merchantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  ratingBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.round,
  },
  merchantLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  discountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  viewButton: {
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  discountsGrid: {
    
  },
  discountCardContainer: {
    marginBottom: SPACING.md,
  },
  mapPreview: {
    height: moderateScale(100),
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  mapText: {
    marginBottom: SPACING.xs,
  },
  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
  // Search suggestions styles
  searchSuggestionsContainer: {
    
  },
  suggestionsSection: {
    marginBottom: SPACING.lg,
  },
  recentSearches: {
    
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendingItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  // Empty state styles
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  // Skeleton styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonCard: {
    height: moderateScale(180),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
});

export default ExploreScreen;