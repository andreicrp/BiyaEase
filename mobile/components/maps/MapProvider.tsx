import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Coordinates, MapRegion } from '../../utils/geoUtils';
import { ApiTransitStop, ApiPlace } from '../../services/transitApiService';

interface MapContextType {
  userLocation: Coordinates;
  setUserLocation: (coords: Coordinates) => void;
  currentRegion: MapRegion;
  setCurrentRegion: (region: MapRegion) => void;
  selectedStop: ApiTransitStop | null;
  setSelectedStop: (stop: ApiTransitStop | null) => void;
  selectedPlace: ApiPlace | null;
  setSelectedPlace: (place: ApiPlace | null) => void;
  hasLocationPermission: boolean;
  setHasLocationPermission: (granted: boolean) => void;
}

const DEFAULT_REGION: MapRegion = {
  latitude: 14.6538,
  longitude: 121.0685,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const DEFAULT_USER_LOCATION: Coordinates = {
  latitude: 14.6538,
  longitude: 121.0685,
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<Coordinates>(DEFAULT_USER_LOCATION);
  const [currentRegion, setCurrentRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [selectedStop, setSelectedStop] = useState<ApiTransitStop | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<ApiPlace | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(true);

  return (
    <MapContext.Provider
      value={{
        userLocation,
        setUserLocation,
        currentRegion,
        setCurrentRegion,
        selectedStop,
        setSelectedStop,
        selectedPlace,
        setSelectedPlace,
        hasLocationPermission,
        setHasLocationPermission,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
