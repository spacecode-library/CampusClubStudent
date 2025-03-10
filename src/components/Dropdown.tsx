// components/Dropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { ThemeColors } from '../constants/colors';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { TEXT_STYLES } from '../constants/typography';

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  placeholder: string;
  items: DropdownItem[];
  value: string;
  onSelect: (item: DropdownItem) => void;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  colors: ThemeColors;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder,
  items,
  value,
  onSelect,
  error,
  disabled = false,
  loading = false,
  searchable = false,
  colors,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>(items);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get('window').height;
  
  // Get selected item label
  const selectedItem = items.find(item => item.value === value);
  const displayText = selectedItem ? selectedItem.label : placeholder;
  
  // Filter items when search query changes
  useEffect(() => {
    if (searchable && searchQuery) {
      const filtered = items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items, searchable]);
  
  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);
  
  const toggleDropdown = () => {
    if (disabled) return;
    
    Keyboard.dismiss();
    setIsOpen(!isOpen);
    
    Animated.timing(animatedHeight, {
      toValue: isOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    toggleDropdown();
  };
  
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };
  
  return (
    <View style={styles.container}>
      <Text style={[TEXT_STYLES.labelLarge, { color: colors.text, marginBottom: SPACING.xs }]}>
        {label}
      </Text>
      
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleDropdown}
        style={[
          styles.button,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        disabled={disabled}
      >
        <Text
          style={[
            TEXT_STYLES.bodyMedium,
            {
              color: value ? colors.text : colors.placeholder,
              flex: 1,
            },
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 18 }}>
            {isOpen ? '▲' : '▼'}
          </Text>
        )}
      </TouchableOpacity>
      
      {error ? (
        <Text style={[TEXT_STYLES.labelSmall, { color: colors.error, marginTop: SPACING.xs }]}>
          {error}
        </Text>
      ) : null}
      
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={toggleDropdown}
      >
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    maxHeight: windowHeight * 0.5,
                  },
                ]}
              >
                {searchable && (
                  <View
                    style={[
                      styles.searchContainer,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        TEXT_STYLES.bodyMedium,
                        styles.searchInput,
                        { color: colors.text },
                      ]}
                      placeholder="Search..."
                      placeholderTextColor={colors.placeholder}
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                      autoFocus
                    />
                  </View>
                )}
                
                {filteredItems.length > 0 ? (
                  <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.item,
                          {
                            backgroundColor:
                              item.value === value
                                ? `${colors.primary}20`
                                : 'transparent',
                          },
                        ]}
                        onPress={() => handleSelect(item)}
                      >
                        <Text
                          style={[
                            TEXT_STYLES.bodyMedium,
                            {
                              color: colors.text,
                              fontWeight: item.value === value ? '600' : 'normal',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={true}
                  />
                ) : (
                  <View style={styles.noResults}>
                    <Text style={[TEXT_STYLES.bodyMedium, { color: colors.textSecondary }]}>
                      No options found
                    </Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchContainer: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchInput: {
    padding: SPACING.xs,
  },
  noResults: {
    padding: SPACING.md,
    alignItems: 'center',
  },
});

export default Dropdown;