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
  project?: (coord: Coordinates) => { x: number; y: number };
}

const RNView = View as any;

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  coordinates,
  color = colors.primary,
  strokeWidth = 5,
  region,
  width,
  height,
  project,
}) => {
  if (!coordinates || coordinates.length < 2 || width <= 0 || height <= 0) {
    return null;
  }

  // Web Mercator spherical projection matching MapView cartography tile system
  const projectPoint = (coord: Coordinates): { x: number; y: number } => {
    if (project) {
      return project(coord);
    }

    const delta = region.longitudeDelta || 0.035;
    const z = Math.round(Math.log2(360 / delta));
    const zoomLevel = Math.max(10, Math.min(18, z));
    const numTiles = Math.pow(2, zoomLevel);

    const lng2tileX = (lng: number) => ((lng + 180) / 360) * numTiles;
    const lat2tileY = (lat: number) => {
      const latRad = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
      return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * numTiles;
    };

    const centerTileX = lng2tileX(region.longitude);
    const centerTileY = lat2tileY(region.latitude);

    const viewportTopLeftX = centerTileX * 256 - width / 2;
    const viewportTopLeftY = centerTileY * 256 - height / 2;

    const px = lng2tileX(coord.longitude) * 256 - viewportTopLeftX;
    const py = lat2tileY(coord.latitude) * 256 - viewportTopLeftY;

    return { x: px, y: py };
  };

  const points = coordinates
    .map(projectPoint)
    .filter((pt) => typeof pt.x === 'number' && typeof pt.y === 'number' && !isNaN(pt.x) && !isNaN(pt.y));

  if (points.length < 2) return null;

  if (Platform.OS === 'web') {
    // Generate SVG path string for Web platform
    const pathData = points.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      return `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');

    return (
      <RNView style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
        <svg style={{ position: 'absolute', width, height }} viewBox={`0 0 ${width} ${height}`}>
          <path
            d={pathData}
            fill="none"
            stroke="rgba(0, 0, 0, 0.25)"
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
      </RNView>
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
      <RNView
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
    <RNView style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {segments}
    </RNView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
