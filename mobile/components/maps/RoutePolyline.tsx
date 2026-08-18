import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Coordinates, MapRegion } from '../../utils/geoUtils';
import { colors } from '../../constants/colors';

interface RoutePolylineProps {
  coordinates: Coordinates[];
  color?: string;
  strokeWidth?: number;
  region: MapRegion;
  width: number;
  height: number;
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  coordinates,
  color = colors.primary,
  strokeWidth = 5,
  region,
  width,
  height,
}) => {
  if (!coordinates || coordinates.length < 2 || width <= 0 || height <= 0) {
    return null;
  }

  // Project geographic coordinates to pixel coordinates on the map view
  const project = (coord: Coordinates): { x: number; y: number } => {
    const latDelta = region.latitudeDelta || 0.05;
    const lngDelta = region.longitudeDelta || 0.05;

    const minLat = region.latitude - latDelta / 2;
    const maxLat = region.latitude + latDelta / 2;
    const minLng = region.longitude - lngDelta / 2;
    const maxLng = region.longitude + lngDelta / 2;

    const x = ((coord.longitude - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - coord.latitude) / (maxLat - minLat)) * height;

    return { x, y };
  };

  const points = coordinates.map(project);

  if (Platform.OS === 'web') {
    // Generate SVG path string for Web platform
    const pathData = points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      return `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');

    return (
      <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
        <svg style={{ position: 'absolute', width, height }} viewBox={`0 0 ${width} ${height}`}>
          <path
            d={pathData}
            fill="none"
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </View>
    );
  }

  // Pure React Native geometric line segment rendering for Android & iOS
  const segments: React.ReactNode[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (!p1 || !p2) continue;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    segments.push(
      <View
        key={`seg-${i}`}
        style={{
          position: 'absolute',
          left: midX - length / 2,
          top: midY - strokeWidth / 2,
          width: length,
          height: strokeWidth,
          backgroundColor: color,
          borderRadius: strokeWidth / 2,
          transform: [{ rotate: `${angle}deg` }],
        }}
      />
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {segments}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
