import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../constants/colors';
import { MainTabType, BottomNavigation } from '../components/navigation/BottomNavigation';
import { JourneyProvider, useJourney } from '../context/JourneyContext';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LocationPermissionScreen } from '../screens/LocationPermissionScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { RouteOptionsScreen } from '../screens/RouteOptionsScreen';
import { RouteDetailsScreen } from '../screens/RouteDetailsScreen';
import { ActiveJourneyScreen } from '../screens/ActiveJourneyScreen';
import { NearbyScreen } from '../screens/NearbyScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Types & Mock Data
import { Destination, RouteOption, SavedPlace, SavedRoute, RecentTrip } from '../types/index';
import { SelectedLocation } from '../types/search.types';
import { Journey } from '../types/routing.types';
import { mockRouteOptions } from '../data/mockData';

const RNView = View as any;
const RNStatusBar = StatusBar as any;

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

function MainApp(): React.JSX.Element {
  const [flowState, setFlowState] = useState<AppFlowState>('splash');
  const [prevFlowState, setPrevFlowState] = useState<AppFlowState>('main');
  const [activeTab, setActiveTab] = useState<MainTabType>('home');
  const [searchMode, setSearchMode] = useState<'destination' | 'origin'>('destination');
  const { startJourney } = useJourney();

  // Active Flow State Data
  const [selectedOrigin, setSelectedOrigin] = useState<Destination | SelectedLocation | string>(
    'UP Diliman, Quezon City'
  );
  const [selectedDestination, setSelectedDestination] = useState<
    Destination | SelectedLocation | string
  >('SM North EDSA');
  const [selectedRoute, setSelectedRoute] = useState<Journey | RouteOption>(mockRouteOptions[0]!);

  const activeOriginName = typeof selectedOrigin === 'string' ? selectedOrigin : selectedOrigin.name;

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
    setSearchMode('destination');
    setPrevFlowState(flowState);
    setFlowState('search');
  };

  const handleOpenOriginSearch = (): void => {
    setSearchMode('origin');
    setPrevFlowState(flowState);
    setFlowState('search');
  };

  const handleSelectDestination = (dest: Destination | SelectedLocation | string): void => {
    if (searchMode === 'origin') {
      setSelectedOrigin(dest);
      setFlowState(prevFlowState === 'route_options' ? 'route_options' : 'main');
    } else {
      setSelectedDestination(dest);
      setFlowState('route_options');
    }
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
    startJourney(route);
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
    return (
      <SearchScreen
        mode={searchMode}
        onBack={handleBackToMain}
        onSelectDestination={handleSelectDestination}
      />
    );
  }

  if (flowState === 'route_options') {
    return (
      <RouteOptionsScreen
        origin={selectedOrigin}
        destination={selectedDestination}
        onBack={handleBackToMain}
        onSelectRoute={handleSelectRouteOption}
        onEditOrigin={handleOpenOriginSearch}
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
    return <ActiveJourneyScreen onExit={handleEndTrip} />;
  }

  if (flowState === 'settings') {
    return <SettingsScreen onBack={handleBackToMain} />;
  }

  // Main Tab Navigation View
  return (
    <RNView style={styles.mainContainer}>
      <RNStatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Tab Screen Content */}
      <RNView style={styles.tabContent}>
        {activeTab === 'home' && (
          <HomeScreen
            currentOriginName={activeOriginName}
            onOpenSearch={handleOpenSearch}
            onOpenOriginSearch={handleOpenOriginSearch}
            onSelectDestination={handleSelectDestination}
            onSelectSavedPlace={handleSelectSavedPlace}
            onSelectRecentTrip={handleSelectRecentTrip}
            onOpenNearby={() => setActiveTab('nearby')}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenActiveJourney={() => setFlowState('navigation')}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyScreen
            originName={activeOriginName}
            onOpenSearch={handleOpenSearch}
            onOpenOriginSearch={handleOpenOriginSearch}
            onSelectTransport={(_item) => {
              setFlowState('route_options');
            }}
          />
        )}

        {activeTab === 'saved' && (
          <SavedScreen
            onSelectAsOrigin={(loc) => {
              setSelectedOrigin({ ...loc, type: loc.type || 'place' });
              setFlowState('route_options');
            }}
            onSelectAsDestination={(loc) => {
              setSelectedDestination({ ...loc, type: loc.type || 'place' });
              setFlowState('route_options');
            }}
            onLaunchFavoriteRoute={(locations) => {
              setSelectedOrigin({ ...locations.origin, type: 'place' });
              setSelectedDestination({ ...locations.destination, type: 'place' });
              setFlowState('route_options');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            onOpenSettings={() => setFlowState('settings')}
            onOpenSaved={() => setActiveTab('saved')}
          />
        )}
      </RNView>

      {/* Persistent Bottom Tab Bar */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </RNView>
  );
}

import { SavedDataProvider } from '../context/SavedDataContext';

export default function App(): React.JSX.Element {
  return (
    <SavedDataProvider>
      <JourneyProvider>
        <MainApp />
      </JourneyProvider>
    </SavedDataProvider>
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
