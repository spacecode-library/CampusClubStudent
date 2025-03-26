import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Location from 'expo-location';
import Button from '../components/Button'; // Assuming a custom Button component exists
import { useTheme } from '../context/ThemeContext';

// Define Coordinates interface
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationSelected: (coordinates: Coordinates, address: string) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelected }) => {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [markerPosition, setMarkerPosition] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 37.78825, // Default: San Francisco
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const { colors } = useTheme();

  // Get current location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const newRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    setMarkerPosition(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      if (response.data) {
        setAddress(response.data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Geocode address using Nominatim API
  const geocodeAddress = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      if (response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const newCoordinates: Coordinates = { latitude: parseFloat(lat), longitude: parseFloat(lon) };
        setCoordinates(newCoordinates);
        setMarkerPosition(newCoordinates);
        setAddress(display_name);
        setRegion({
          ...newCoordinates,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        alert('No results found for the entered address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error finding location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (e: { nativeEvent: { coordinate: Coordinates } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  // Confirm the selected location
  const confirmLocation = () => {
    if (markerPosition) {
      onLocationSelected(markerPosition, address);
    } else {
      alert('Please select a location first.');
    }
  };

  // Zoom controls
  const zoomIn = () => {
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * 0.5,
      longitudeDelta: region.longitudeDelta * 0.5,
    });
  };

  const zoomOut = () => {
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    });
  };

  // Animate map to new coordinates
  useEffect(() => {
    if (coordinates && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [coordinates]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Select Event Location</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={address}
          onChangeText={setAddress}
          placeholder="Search for a location"
          placeholderTextColor={colors.textSecondary}
        />
        {address.length > 0 && (
          <TouchableOpacity onPress={() => setAddress('')} style={styles.clearButton}>
            <Icon name="times" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <Button
        title="Search"
        onPress={geocodeAddress}
        variant="secondary"
        loading={isLoading}
        style={styles.searchButton}
      />

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />
          {markerPosition && (
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={handleMarkerDragEnd}
              title="Event Location"
              pinColor={colors.primary} // Custom marker color
            />
          )}
        </MapView>

        {/* Zoom Controls */}
        <View style={[styles.zoomControls, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
            <Icon name="plus" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
            <Icon name="minus" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Current Location Button */}
        <TouchableOpacity
          onPress={getCurrentLocation}
          style={[styles.currentLocationButton, { backgroundColor: colors.card }]}
        >
          <Icon name="crosshairs" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Button
        title="Confirm Location"
        onPress={confirmLocation}
        variant="primary"
        style={styles.confirmButton}
      />

      <Text style={[styles.attribution, { color: colors.textSecondary }]}>
        Map data © OpenStreetMap contributors
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
  },
  searchButton: {
    marginBottom: 15,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 8,
    padding: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  zoomButton: {
    padding: 8,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    borderRadius: 8,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButton: {
    marginTop: 15,
  },
  attribution: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LocationPicker;