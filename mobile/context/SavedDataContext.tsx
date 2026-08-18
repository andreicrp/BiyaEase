import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SavedPlace,
  FavoriteRoute,
  SavedPlacesRepository,
  FavoriteRoutesRepository,
  SavedLocationReference,
} from '../types/savedData.types';
import { localSavedPlacesRepository } from '../repositories/savedPlacesRepository';
import { localFavoriteRoutesRepository } from '../repositories/favoriteRoutesRepository';

interface SavedDataContextType {
  savedPlaces: SavedPlace[];
  favoriteRoutes: FavoriteRoute[];
  loading: boolean;
  savePlace: (
    placeInput: Partial<SavedPlace> & { name: string; latitude: number; longitude: number },
    options?: { forceReplaceCategory?: boolean }
  ) => Promise<{
    success: boolean;
    place?: SavedPlace;
    requiresReplace?: 'home' | 'work';
    error?: string;
  }>;
  updatePlace: (place: SavedPlace) => Promise<{ success: boolean; error?: string }>;
  deletePlace: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveRoute: (
    routeInput: Partial<FavoriteRoute> & {
      name: string;
      origin: SavedLocationReference;
      destination: SavedLocationReference;
    }
  ) => Promise<{ success: boolean; route?: FavoriteRoute; error?: string }>;
  updateRoute: (route: FavoriteRoute) => Promise<{ success: boolean; error?: string }>;
  deleteRoute: (id: string) => Promise<{ success: boolean; error?: string }>;
  launchFavoriteRoute: (route: FavoriteRoute) => Promise<{
    origin: SavedLocationReference;
    destination: SavedLocationReference;
  }>;
  refreshSavedData: () => Promise<void>;
}

const SavedDataContext = createContext<SavedDataContextType | undefined>(undefined);

interface SavedDataProviderProps {
  children: React.ReactNode;
  savedPlacesRepo?: SavedPlacesRepository;
  favoriteRoutesRepo?: FavoriteRoutesRepository;
}

export const SavedDataProvider: React.FC<SavedDataProviderProps> = ({
  children,
  savedPlacesRepo = localSavedPlacesRepository,
  favoriteRoutesRepo = localFavoriteRoutesRepository,
}) => {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSavedData = useCallback(async () => {
    try {
      setLoading(true);
      const [places, routes] = await Promise.all([
        savedPlacesRepo.getAll(),
        favoriteRoutesRepo.getAll(),
      ]);
      setSavedPlaces(places);
      setFavoriteRoutes(routes);
    } catch (err) {
      console.error('[SAVED_DATA_CONTEXT] Failed to load saved data:', err);
    } finally {
      setLoading(false);
    }
  }, [savedPlacesRepo, favoriteRoutesRepo]);

  useEffect(() => {
    refreshSavedData();
  }, [refreshSavedData]);

  const savePlace = async (
    placeInput: Partial<SavedPlace> & { name: string; latitude: number; longitude: number },
    options?: { forceReplaceCategory?: boolean }
  ) => {
    const res = await savedPlacesRepo.save(placeInput as SavedPlace, options);
    if (res.success) {
      await refreshSavedData();
    }
    return res;
  };

  const updatePlace = async (place: SavedPlace) => {
    const res = await savedPlacesRepo.update(place);
    if (res.success) {
      await refreshSavedData();
    }
    return res;
  };

  const deletePlace = async (id: string) => {
    const res = await savedPlacesRepo.delete(id);
    if (res.success) {
      await refreshSavedData();
    }
    return res;
  };

  const saveRoute = async (
    routeInput: Partial<FavoriteRoute> & {
      name: string;
      origin: SavedLocationReference;
      destination: SavedLocationReference;
    }
  ) => {
    const res = await favoriteRoutesRepo.save(routeInput as FavoriteRoute);
    if (res.success) {
      await refreshSavedData();
    }
    return res;
  };

  const updateRoute = async (route: FavoriteRoute) => {
    const res = await favoriteRoutesRepo.update(route);
    if (res.success) {
      await refreshSavedData();
    }
    return res;
  };

  const deleteRoute = async (id: string) => {
    const res = await favoriteRoutesRepo.delete(id);
    if (res.success) {
      await refreshSavedData();
    }
    return res;
  };

  const launchFavoriteRoute = async (route: FavoriteRoute) => {
    if (favoriteRoutesRepo.updateLastUsed) {
      await favoriteRoutesRepo.updateLastUsed(route.id);
      await refreshSavedData();
    }
    return {
      origin: route.origin,
      destination: route.destination,
    };
  };

  return (
    <SavedDataContext.Provider
      value={{
        savedPlaces,
        favoriteRoutes,
        loading,
        savePlace,
        updatePlace,
        deletePlace,
        saveRoute,
        updateRoute,
        deleteRoute,
        launchFavoriteRoute,
        refreshSavedData,
      }}
    >
      {children}
    </SavedDataContext.Provider>
  );
};

export const useSavedData = (): SavedDataContextType => {
  const context = useContext(SavedDataContext);
  if (!context) {
    throw new Error('useSavedData must be used within a SavedDataProvider');
  }
  return context;
};
