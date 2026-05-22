import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import AppNavigator from '../navigation/AppNavigator';
import AuthNavigator from '../navigation/AuthNavigator';
import DailyCheckinGate from './rewards/DailyCheckinGate';
import SplashScreen from './SplashScreen';
import { GuestAuthProvider } from '../context/GuestAuthContext';
import { ROUTES } from '../constants/routes';
import { initAuth } from '../redux/slices/authSlice';

// ---------------------------------------------------------------------------
// AuthWrapper
//
// Deep-link fix summary:
//
//   Bug 1 fixed — onDeepLink prop is now accepted and used.
//
//   Bug 2 fixed — cold-start URL (app launched by tapping the link) is
//   retrieved via Linking.getInitialURL() AFTER initAuth resolves. We wait
//   for initAuth so accessToken is in Redux before handleDeepLink runs its
//   auth check.
//
//   Bug 3 fixed — warm-start URL (app already running / brought to
//   foreground) is handled via Linking.addEventListener so links tapped
//   while the app is backgrounded also work.
//
// Everything else — guest mode, auth routing, splash screen — is unchanged.
// ---------------------------------------------------------------------------

export default function AuthWrapper({ onDeepLink }) {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isInitializing = useSelector((state) => state.auth.isInitializing);
  const [guestMode, setGuestMode] = useState(false);
  const [authEntryRoute, setAuthEntryRoute] = useState(ROUTES.LOGIN);

  // Track whether we've already consumed the cold-start URL so we don't
  // fire it a second time if isInitializing flips unexpectedly.
  const coldStartHandled = useRef(false);

  // Kick off auth restoration on mount (unchanged behaviour)
  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  // ------------------------------------------------------------------
  // Cold-start deep link — app was LAUNCHED by tapping the share link.
  // We wait until initAuth finishes (isInitializing → false) so that
  // accessToken is already in Redux when handleDeepLink runs its check.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isInitializing) return;                 // wait for auth to settle
    if (coldStartHandled.current) return;       // only run once
    if (!onDeepLink) return;

    coldStartHandled.current = true;

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          try {
            onDeepLink({ url });
          } catch (error) {
            console.error('Error handling deep link:', error);
          }
        }
      })
      .catch((error) => {
        console.error('Error retrieving initial URL:', error);
      });
  }, [isInitializing, onDeepLink]);

  // ------------------------------------------------------------------
  // Warm-start deep link — app was already running (background/foreground).
  // Standard event listener; cleaned up on unmount.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!onDeepLink) return;
    
    const handleUrl = ({ url }) => {
      try {
        onDeepLink({ url });
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };
    
    const subscription = Linking.addEventListener('url', handleUrl);
    return () => {
      if (subscription) subscription.remove();
    };
  }, [onDeepLink]);

  // ------------------------------------------------------------------
  // All existing auth/guest routing logic — completely unchanged
  // ------------------------------------------------------------------

  const onGuestAccess = useCallback(() => {
    setGuestMode(true);
  }, []);

  const openSignUp = useCallback(() => {
    setGuestMode(false);
    setAuthEntryRoute(ROUTES.SIGNUP);
  }, []);

  const openLogin = useCallback(() => {
    setGuestMode(false);
    setAuthEntryRoute(ROUTES.LOGIN);
  }, []);

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (accessToken) {
    return (
      <DailyCheckinGate>
        <AppNavigator />
      </DailyCheckinGate>
    );
  }

  if (guestMode) {
    return (
      <GuestAuthProvider onOpenSignUp={openSignUp} onOpenLogin={openLogin}>
        <AppNavigator />
      </GuestAuthProvider>
    );
  }

  return (
    <AuthNavigator
      key={authEntryRoute}
      initialRouteName={authEntryRoute}
      onGuestAccess={onGuestAccess}
    />
  );
}