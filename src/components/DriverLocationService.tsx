// Driver Location Tracking Service
// src/components/DriverLocationService.tsx

"use client";

import { useEffect, useRef } from 'react';
import { updateDriverLocation } from '@/firebase/live-tracking';
import { useToast } from '@/hooks/use-toast';

interface DriverLocationServiceProps {
  tripId: string;
  driverId: string;
  isActive: boolean;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

/**
 * Background service that tracks driver location
 * and updates it to Firestore every 5 seconds
 * 
 * Usage:
 * <DriverLocationService 
 *   tripId={tripId}
 *   driverId={driverId}
 *   isActive={rideStatus === 'active'}
 * />
 */
export function DriverLocationService({
  tripId,
  driverId,
  isActive,
  onLocationUpdate,
}: DriverLocationServiceProps) {
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    // Request location permission
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation Error',
        description: 'Your device does not support geolocation.',
      });
      return;
    }

    // Start watching location with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const speed = position.coords.speed || 0;
        const heading = position.coords.heading || 0;
        const accuracy = position.coords.accuracy || 0;

        lastLocationRef.current = { latitude, longitude };

        // Call optional callback
        onLocationUpdate?.(latitude, longitude);

        // Send to Firestore every 5 seconds (done in interval below)
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Unable to get location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Please allow location access for driver tracking.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: errorMessage,
        });
      },
      {
        enableHighAccuracy: true, // Use GPS for accuracy
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Update location in Firestore every 5 seconds
    updateIntervalRef.current = setInterval(async () => {
      if (lastLocationRef.current) {
        try {
          await updateDriverLocation(tripId, {
            driverId,
            latitude: lastLocationRef.current.latitude,
            longitude: lastLocationRef.current.longitude,
            speed: 0,
          });
        } catch (error) {
          console.error('Error updating location to Firestore:', error);
        }
      }
    }, 5000); // 5 seconds

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isActive, tripId, driverId, onLocationUpdate]);

  // This component doesn't render anything
  return null;
}

/**
 * Hook to use location tracking in driver app
 */
export function useLocationTracking(
  tripId: string,
  driverId: string,
  isActive: boolean
) {
  const [location, setLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  return {
    location,
    service: (
      <DriverLocationService
        tripId={tripId}
        driverId={driverId}
        isActive={isActive}
        onLocationUpdate={(lat, lng) => {
          setLocation({ latitude: lat, longitude: lng });
        }}
      />
    ),
  };
}
