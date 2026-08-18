import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent, ViewStyle } from 'react-native';
import { Coordinates, MapRegion, calculateRegionForCoordinates } from '../../utils/geoUtils';
import { UserLocationMarker } from './UserLocationMarker';
import { StopMarker } from './StopMarker';
import { PlaceMarker } from './PlaceMarker';
import { RoutePolyline } from './RoutePolyline';
import { MapControls } from './MapControls';
import { StopInfoCard } from './StopInfoCard';
import { PlaceInfoCard } from './PlaceInfoCard';
import { ApiTransitStop, ApiPlace } from '../../services/transitApiService';

export interface MapMarkerItem {
  id: string;
  type: 'stop' | 'place' | 'user';
  coordinate: Coordinates;
  title: string;
  subtitle?: string;
  mode?: string;
  modeColor?: string;
  category?: string;
  sequence?: number;
  data?: ApiTransitStop | ApiPlace;
}

export interface MapPolylineItem {
  id: string;
  coordinates: Coordinates[];
  color?: string;
  strokeWidth?: number;
}

interface MapViewProps {
  initialRegion?: MapRegion;
  region?: MapRegion;
  showsUserLocation?: boolean;
  userLocation?: Coordinates;
  stops?: ApiTransitStop[];
  places?: ApiPlace[];
  polylines?: MapPolylineItem[];
  selectedStop?: ApiTransitStop | null;
  selectedPlace?: ApiPlace | null;
  onSelectStop?: (stop: ApiTransitStop | null) => void;
  onSelectPlace?: (place: ApiPlace | null) => void;
  onRegionChange?: (region: MapRegion) => void;
  fitCoordinates?: Coordinates[];
  height?: number | string;
  style?: ViewStyle;
  showControls?: boolean;
}

const DEFAULT_METRO_MANILA_REGION: MapRegion = {
  latitude: 14.6538,
  longitude: 121.0685,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export const MapView: React.FC<MapViewProps> = ({
  initialRegion = DEFAULT_METRO_MANILA_REGION,
  region: controlledRegion,
  showsUserLocation = true,
  userLocation = { latitude: 14.6538, longitude: 121.0685 },
  stops = [],
  places = [],
  polylines = [],
  selectedStop: controlledSelectedStop,
  selectedPlace: controlledSelectedPlace,
  onSelectStop,
  onSelectPlace,
  onRegionChange,
  fitCoordinates,
  height = 300,
  style,
  showControls = true,
}) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 360,
    height: typeof height === 'number' ? height : 300,
  });

  const [currentRegion, setCurrentRegion] = useState<MapRegion>(controlledRegion || initialRegion);
  const [activeStop, setActiveStop] = useState<ApiTransitStop | null>(null);
  const [activePlace, setActivePlace] = useState<ApiPlace | null>(null);

  // Sync controlled state
  useEffect(() => {
    if (controlledRegion) {
      setCurrentRegion(controlledRegion);
    }
  }, [controlledRegion]);

  useEffect(() => {
    if (controlledSelectedStop !== undefined) {
      setActiveStop(controlledSelectedStop);
    }
  }, [controlledSelectedStop]);

  useEffect(() => {
    if (controlledSelectedPlace !== undefined) {
      setActivePlace(controlledSelectedPlace);
    }
  }, [controlledSelectedPlace]);

  // Fit camera bounds if fitCoordinates are provided
  useEffect(() => {
    if (fitCoordinates && fitCoordinates.length > 0) {
      const fitted = calculateRegionForCoordinates(fitCoordinates);
      setCurrentRegion(fitted);
      onRegionChange?.(fitted);
    }
  }, [fitCoordinates, onRegionChange]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    if (width > 0 && h > 0) {
      setDimensions({ width, height: h });
    }
  };

  // Convert lat/lng into viewport X, Y
  const projectToPixels = (coord: Coordinates): { x: number; y: number } => {
    const { width, height: h } = dimensions;
    const minLat = currentRegion.latitude - currentRegion.latitudeDelta / 2;
    const maxLat = currentRegion.latitude + currentRegion.latitudeDelta / 2;
    const minLng = currentRegion.longitude - currentRegion.longitudeDelta / 2;
    const maxLng = currentRegion.longitude + currentRegion.longitudeDelta / 2;

    const x = ((coord.longitude - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - coord.latitude) / (maxLat - minLat)) * h;

    return { x, y };
  };

  // Zoom handling
  const handleZoom = (factor: number) => {
    const nextRegion: MapRegion = {
      ...currentRegion,
      latitudeDelta: Math.max(Math.min(currentRegion.latitudeDelta * factor, 0.5), 0.002),
      longitudeDelta: Math.max(Math.min(currentRegion.longitudeDelta * factor, 0.5), 0.002),
    };
    setCurrentRegion(nextRegion);
    onRegionChange?.(nextRegion);
  };

  const handleRecenter = () => {
    if (userLocation) {
      const nextRegion: MapRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      };
      setCurrentRegion(nextRegion);
      onRegionChange?.(nextRegion);
    }
  };

  // Pan gesture tracking
  const panStartRef = useRef<{ lat: number; lng: number }>({
    lat: currentRegion.latitude,
    lng: currentRegion.longitude,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        panStartRef.current = {
          lat: currentRegion.latitude,
          lng: currentRegion.longitude,
        };
      },
      onPanResponderMove: (_, gesture) => {
        const { width, height: h } = dimensions;
        const dLng = -(gesture.dx / width) * currentRegion.longitudeDelta;
        const dLat = (gesture.dy / h) * currentRegion.latitudeDelta;

        const nextLat = panStartRef.current.lat + dLat;
        const nextLng = panStartRef.current.lng + dLng;

        setCurrentRegion((prev) => ({
          ...prev,
          latitude: nextLat,
          longitude: nextLng,
        }));
      },
      onPanResponderRelease: () => {
        onRegionChange?.(currentRegion);
      },
    })
  ).current;

  // Selected item handlers
  const handleStopPress = (stop: ApiTransitStop) => {
    setActivePlace(null);
    setActiveStop(stop);
    onSelectStop?.(stop);
    onSelectPlace?.(null);
  };

  const handlePlacePress = (place: ApiPlace) => {
    setActiveStop(null);
    setActivePlace(place);
    onSelectPlace?.(place);
    onSelectStop?.(null);
  };

  return (
    <View
      style={[styles.container, { height: typeof height === 'number' ? height : undefined }, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Background Cartographic Vector Grid */}
      <View style={styles.mapGridCanvas}>
        <View style={styles.gridOverlay} />
      </View>

      {/* Render Polylines */}
      {polylines.map((poly) => (
        <RoutePolyline
          key={poly.id}
          coordinates={poly.coordinates}
          color={poly.color}
          strokeWidth={poly.strokeWidth || 5}
          region={currentRegion}
          width={dimensions.width}
          height={dimensions.height}
        />
      ))}

      {/* Render Place Markers */}
      {places.map((place) => {
        const pt = projectToPixels({
          latitude: place.latitude,
          longitude: place.longitude,
        });

        // Hide if offscreen
        if (
          pt.x < -40 ||
          pt.x > dimensions.width + 40 ||
          pt.y < -40 ||
          pt.y > dimensions.height + 40
        ) {
          return null;
        }

        return (
          <View
            key={`place-${place.id}`}
            style={[styles.markerAbsolute, { left: pt.x - 18, top: pt.y - 30 }]}
          >
            <PlaceMarker
              name={place.name}
              category={place.category}
              isSelected={activePlace?.id === place.id}
              onPress={() => handlePlacePress(place)}
            />
          </View>
        );
      })}

      {/* Render Stop Markers */}
      {stops.map((stop, idx) => {
        const pt = projectToPixels({
          latitude: stop.latitude,
          longitude: stop.longitude,
        });

        // Hide if offscreen
        if (
          pt.x < -40 ||
          pt.x > dimensions.width + 40 ||
          pt.y < -40 ||
          pt.y > dimensions.height + 40
        ) {
          return null;
        }

        return (
          <View
            key={`stop-${stop.id}`}
            style={[styles.markerAbsolute, { left: pt.x - 20, top: pt.y - 36 }]}
          >
            <StopMarker
              name={stop.name}
              mode={stop.mode}
              modeColor={stop.mode_color}
              sequence={idx + 1}
              isSelected={activeStop?.id === stop.id}
              onPress={() => handleStopPress(stop)}
            />
          </View>
        );
      })}

      {/* Render User GPS Location Marker */}
      {showsUserLocation &&
        userLocation &&
        (() => {
          const uPt = projectToPixels(userLocation);
          return (
            <View style={[styles.markerAbsolute, { left: uPt.x - 18, top: uPt.y - 18 }]}>
              <UserLocationMarker size={18} />
            </View>
          );
        })()}

      {/* Map Control Buttons (Recenter / Zoom) */}
      {showControls && (
        <MapControls
          onRecenter={handleRecenter}
          onZoomIn={() => handleZoom(0.6)}
          onZoomOut={() => handleZoom(1.5)}
        />
      )}

      {/* Floating Stop Info Bottom Card */}
      {activeStop && (
        <StopInfoCard
          stop={activeStop}
          onClose={() => {
            setActiveStop(null);
            onSelectStop?.(null);
          }}
        />
      )}

      {/* Floating Place Info Bottom Card */}
      {activePlace && (
        <PlaceInfoCard
          place={activePlace}
          onClose={() => {
            setActivePlace(null);
            onSelectPlace?.(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGridCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E9EC',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  markerAbsolute: {
    position: 'absolute',
    zIndex: 20,
  },
});
