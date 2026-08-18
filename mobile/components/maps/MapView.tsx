import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  ViewStyle,
  Image,
  Text,
} from 'react-native';
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
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const TILE_SIZE = 256;

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

  // Compute Web Mercator Zoom level (10 - 18)
  const zoomLevel = useMemo(() => {
    const delta = currentRegion.longitudeDelta || 0.03;
    const z = Math.round(Math.log2(360 / delta));
    return Math.max(11, Math.min(18, z));
  }, [currentRegion.longitudeDelta]);

  // Web Mercator coordinate calculations
  const numTiles = useMemo(() => Math.pow(2, zoomLevel), [zoomLevel]);

  const lat2tileY = (lat: number): number => {
    const latRad = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * numTiles;
  };

  const lng2tileX = (lng: number): number => {
    return ((lng + 180) / 360) * numTiles;
  };

  const centerTileX = lng2tileX(currentRegion.longitude);
  const centerTileY = lat2tileY(currentRegion.latitude);

  const centerPixelX = centerTileX * TILE_SIZE;
  const centerPixelY = centerTileY * TILE_SIZE;

  const viewportTopLeftX = centerPixelX - dimensions.width / 2;
  const viewportTopLeftY = centerPixelY - dimensions.height / 2;

  // Project latitude/longitude coordinate to viewport pixel (X, Y)
  const projectToPixels = (coord: Coordinates): { x: number; y: number } => {
    const tileX = lng2tileX(coord.longitude);
    const tileY = lat2tileY(coord.latitude);

    const px = tileX * TILE_SIZE - viewportTopLeftX;
    const py = tileY * TILE_SIZE - viewportTopLeftY;

    return { x: px, y: py };
  };

  // Generate visible cartography map tiles (OpenStreetMap / CartoDB)
  const visibleTiles = useMemo(() => {
    const minTileX = Math.floor(viewportTopLeftX / TILE_SIZE);
    const maxTileX = Math.floor((viewportTopLeftX + dimensions.width) / TILE_SIZE);
    const minTileY = Math.floor(viewportTopLeftY / TILE_SIZE);
    const maxTileY = Math.floor((viewportTopLeftY + dimensions.height) / TILE_SIZE);

    const tiles: { key: string; url: string; left: number; top: number }[] = [];

    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        if (y < 0 || y >= numTiles) continue;
        const normalizedX = ((x % numTiles) + numTiles) % numTiles;
        const left = x * TILE_SIZE - viewportTopLeftX;
        const top = y * TILE_SIZE - viewportTopLeftY;

        // OpenStreetMap Cartography tile server
        const url = `https://tile.openstreetmap.org/${zoomLevel}/${normalizedX}/${y}.png`;

        tiles.push({
          key: `tile-${zoomLevel}-${normalizedX}-${y}`,
          url,
          left,
          top,
        });
      }
    }
    return tiles;
  }, [viewportTopLeftX, viewportTopLeftY, dimensions.width, dimensions.height, numTiles, zoomLevel]);

  // Zoom controls
  const handleZoom = (factor: number) => {
    const nextDelta = Math.max(
      Math.min(currentRegion.longitudeDelta * factor, 0.25),
      0.003
    );
    const nextRegion: MapRegion = {
      ...currentRegion,
      latitudeDelta: nextDelta,
      longitudeDelta: nextDelta,
    };
    setCurrentRegion(nextRegion);
    onRegionChange?.(nextRegion);
  };

  const handleRecenter = () => {
    if (userLocation) {
      const nextRegion: MapRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setCurrentRegion(nextRegion);
      onRegionChange?.(nextRegion);
    }
  };

  // Smooth Pan Gestures
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

  // Selection handlers
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
      style={[
        styles.container,
        { height: typeof height === 'number' ? height : undefined },
        style,
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* 1. Real Street Cartography Map Tiles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {visibleTiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={{
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            resizeMode="cover"
          />
        ))}
      </View>

      {/* 2. Attribution Watermark */}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>

      {/* 3. Render PostGIS Route Polylines */}
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

      {/* 4. Render Landmark Place Markers */}
      {places.map((place) => {
        const pt = projectToPixels({
          latitude: place.latitude,
          longitude: place.longitude,
        });

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

      {/* 5. Render Transit Stop Markers */}
      {stops.map((stop, idx) => {
        const pt = projectToPixels({
          latitude: stop.latitude,
          longitude: stop.longitude,
        });

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

      {/* 6. Render User GPS Location Marker */}
      {showsUserLocation && userLocation && (
        (() => {
          const uPt = projectToPixels(userLocation);
          return (
            <View style={[styles.markerAbsolute, { left: uPt.x - 18, top: uPt.y - 18 }]}>
              <UserLocationMarker size={18} />
            </View>
          );
        })()
      )}

      {/* 7. Map Controls (Recenter, Zoom In, Zoom Out) */}
      {showControls && (
        <MapControls
          onRecenter={handleRecenter}
          onZoomIn={() => handleZoom(0.6)}
          onZoomOut={() => handleZoom(1.5)}
        />
      )}

      {/* 8. Floating Bottom Info Sheets */}
      {activeStop && (
        <StopInfoCard
          stop={activeStop}
          onClose={() => {
            setActiveStop(null);
            onSelectStop?.(null);
          }}
        />
      )}

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
    backgroundColor: '#E8ECF0',
    overflow: 'hidden',
    position: 'relative',
  },
  markerAbsolute: {
    position: 'absolute',
    zIndex: 20,
  },
  attribution: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    zIndex: 10,
  },
  attributionText: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '600',
  },
});
