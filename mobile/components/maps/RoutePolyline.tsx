import React from 'react';
import { View, StyleSheet } from 'react-native';
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

  // Generate SVG path string
  const pathData = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    return `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {/* Background shadow stroke for contrast */}
      <svg style={{ position: 'absolute', width, height }} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathData}
          fill="none"
          stroke="rgba(0, 0, 0, 0.35)"
          strokeWidth={strokeWidth + 3}
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
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
