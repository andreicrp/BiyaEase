import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../constants/colors';
import { MainTabType, BottomNavigation } from '../components/navigation/BottomNavigation';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LocationPermissionScreen } from '../screens/LocationPermissionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { RouteOptionsScreen } from '../screens/RouteOptionsScreen';
import { RouteDetailsScreen } from '../screens/RouteDetailsScreen';
import { NavigationScreen } from '../screens/NavigationScreen';
import { NearbyScreen } from '../screens/NearbyScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Types & Mock Data
import { Destination, RouteOption, SavedPlace, SavedRoute, RecentTrip } from '../types/index';
import { SelectedLocation } from '../types/search.types';
import { Journey } from '../types/routing.types';
import { mockRouteOptions } from '../data/mockData';

type AppFlowState =
  | 'splash'
  | 'onboarding'
  | 'location_permission'
  | 'main'
  | 'search'
  | 'route_options'
  | 'route_details'
  | 'navigation'
  | 'settings';

export default function App(): React.JSX.Element {
  const [flowState, setFlowState] = useState<AppFlowState>('splash');
  const [activeTab, setActiveTab] = useState<MainTabType>('home');

  // Active Flow State Data
  const [selectedDestination, setSelectedDestination] = useState<
    Destination | SelectedLocation | string
  >('SM North EDSA');
  const [selectedRoute, setSelectedRoute] = useState<Journey | RouteOption>(mockRouteOptions[0]!);

  // Navigation handlers
  const handleSplashFinish = (): void => {
    setFlowState('onboarding');
  };

  const handleOnboardingComplete = (): void => {
    setFlowState('location_permission');
  };

  const handleLocationPermissionAllowed = (): void => {
    setFlowState('main');
  };

  const handleLocationPermissionSkipped = (): void => {
    setFlowState('main');
  };

  const handleOpenSearch = (): void => {
    setFlowState('search');
  };

  const handleSelectDestination = (dest: Destination | SelectedLocation | string): void => {
    setSelectedDestination(dest);
    setFlowState('route_options');
  };

  const handleSelectSavedPlace = (place: SavedPlace): void => {
    setSelectedDestination(place.name);
    setFlowState('route_options');
  };

  const handleSelectRecentTrip = (trip: RecentTrip): void => {
    setSelectedDestination(trip.destination);
    setFlowState('route_options');
  };

  const handleSelectSavedRoute = (savedRoute: SavedRoute): void => {
    setSelectedDestination(savedRoute.destination);
    setFlowState('route_options');
  };

  const handleSelectRouteOption = (route: Journey | RouteOption): void => {
    setSelectedRoute(route);
    setFlowState('route_details');
  };

  const handleStartTrip = (route: Journey | RouteOption): void => {
    setSelectedRoute(route);
    setFlowState('navigation');
  };

  const handleEndTrip = (): void => {
    setFlowState('main');
    setActiveTab('home');
  };

  const handleBackToMain = (): void => {
    setFlowState('main');
  };

  const handleBackToRouteOptions = (): void => {
    setFlowState('route_options');
  };

  // Render Root Views
  if (flowState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} autoAdvance={false} />;
  }

  if (flowState === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (flowState === 'location_permission') {
    return (
      <LocationPermissionScreen
        onAllow={handleLocationPermissionAllowed}
        onSkip={handleLocationPermissionSkipped}
      />
    );
  }

  if (flowState === 'search') {
    return <SearchScreen onBack={handleBackToMain} onSelectDestination={handleSelectDestination} />;
  }

  if (flowState === 'route_options') {
    return (
      <RouteOptionsScreen
        origin="UP Diliman"
        destination={selectedDestination}
        onBack={handleBackToMain}
        onSelectRoute={handleSelectRouteOption}
      />
    );
  }

  if (flowState === 'route_details') {
    return (
      <RouteDetailsScreen
        route={selectedRoute}
        onBack={handleBackToRouteOptions}
        onStartTrip={handleStartTrip}
      />
    );
  }

  if (flowState === 'navigation') {
    return <NavigationScreen route={selectedRoute} onEndTrip={handleEndTrip} />;
  }

  if (flowState === 'settings') {
    return <SettingsScreen onBack={handleBackToMain} />;
  }

  // Main Tab Navigation View
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Tab Screen Content */}
      <View style={styles.tabContent}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenSearch={handleOpenSearch}
            onSelectDestination={handleSelectDestination}
            onSelectSavedPlace={handleSelectSavedPlace}
            onSelectRecentTrip={handleSelectRecentTrip}
            onOpenNearby={() => setActiveTab('nearby')}
            onOpenProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyScreen
            onSelectTransport={(_item) => {
              setFlowState('route_options');
            }}
          />
        )}

        {activeTab === 'saved' && (
          <SavedScreen
            onSelectPlace={handleSelectSavedPlace}
            onSelectRoute={handleSelectSavedRoute}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            onOpenSettings={() => setFlowState('settings')}
            onOpenSaved={() => setActiveTab('saved')}
          />
        )}
      </View>

      {/* Persistent Bottom Tab Bar */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContent: {
    flex: 1,
  },
});
