// Firebase Live Tracking Integration
// src/firebase/live-tracking.ts

import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  addDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// Driver Location Update
// ============================================

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

/**
 * Update driver's current location in Firestore
 * Call this every 5-10 seconds from driver's phone
 */
export const updateDriverLocation = async (
  tripId: string,
  locationData: DriverLocationUpdate
) => {
  try {
    const tripRef = doc(db, 'trips', tripId);
    
    await updateDoc(tripRef, {
      'driverLocation.latitude': locationData.latitude,
      'driverLocation.longitude': locationData.longitude,
      'driverLocation.speed': locationData.speed || 0,
      'driverLocation.heading': locationData.heading || 0,
      'driverLocation.accuracy': locationData.accuracy || 0,
      'driverLocation.timestamp': Timestamp.now(),
      'routeHistory': locationData, // Store in array for history
    });

    console.log(`Driver location updated for trip ${tripId}`);
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
};

// ============================================
// Student Tracking - Real-time Listener
// ============================================

/**
 * Listen to driver's live location updates
 * Use this in student's ride tracker component
 */
export const listenToDriverLocation = (
  tripId: string,
  callback: (location: DriverLocationUpdate) => void
) => {
  const tripRef = doc(db, 'trips', tripId);

  const unsubscribe = onSnapshot(tripRef, (doc) => {
    if (doc.exists()) {
      const tripData = doc.data();
      if (tripData.driverLocation) {
        callback({
          driverId: tripData.driverId,
          latitude: tripData.driverLocation.latitude,
          longitude: tripData.driverLocation.longitude,
          speed: tripData.driverLocation.speed,
          heading: tripData.driverLocation.heading,
          accuracy: tripData.driverLocation.accuracy,
        });
      }
    }
  });

  return unsubscribe;
};

// ============================================
// Emergency Call Logging
// ============================================

export interface EmergencyCallLog {
  tripId: string;
  studentId: string;
  driverId: string;
  timestamp: Timestamp;
  callStatus: 'initiated' | 'answered' | 'missed' | 'declined';
  notes?: string;
}

/**
 * Log emergency calls for safety tracking
 */
export const logEmergencyCall = async (
  tripId: string,
  studentId: string,
  driverId: string
) => {
  try {
    const emergencyCallRef = collection(db, 'emergencyCalls');

    await addDoc(emergencyCallRef, {
      tripId,
      studentId,
      driverId,
      timestamp: Timestamp.now(),
      callStatus: 'initiated',
      location: { /* Add current location */ },
    });

    console.log(`Emergency call logged for trip ${tripId}`);
  } catch (error) {
    console.error('Error logging emergency call:', error);
    throw error;
  }
};

// ============================================
// Share Ride with Family
// ============================================

export interface RideShare {
  tripId: string;
  studentId: string;
  sharedWith: string; // Email or phone
  shareTime: Timestamp;
  shareLink: string;
  expiresAt: Timestamp;
  viewedAt?: Timestamp;
}

/**
 * Share ride details with family/friends
 */
export const shareRide = async (
  tripId: string,
  studentId: string,
  sharedWithEmail: string
) => {
  try {
    const shareRef = collection(db, 'rideShares');
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL}/track/${tripId}?share=true`;

    await addDoc(shareRef, {
      tripId,
      studentId,
      sharedWith: sharedWithEmail,
      shareTime: Timestamp.now(),
      shareLink,
      expiresAt: new Timestamp(
        Math.floor(Date.now() / 1000) + 86400, // Expires in 24 hours
        0
      ),
    });

    // Send email notification (implement with your email service)
    // await sendShareNotification(sharedWithEmail, shareLink, studentName);

    console.log(`Ride shared with ${sharedWithEmail}`);
  } catch (error) {
    console.error('Error sharing ride:', error);
    throw error;
  }
};

/**
 * Get ride shares for a trip
 */
export const getRideShares = async (tripId: string) => {
  try {
    const sharesRef = collection(db, 'rideShares');
    const q = query(sharesRef, where('tripId', '==', tripId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (RideShare & { id: string })[];
  } catch (error) {
    console.error('Error getting ride shares:', error);
    throw error;
  }
};

// ============================================
// Ride History
// ============================================

export interface RideHistoryItem {
  tripId: string;
  studentId: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  vehicleNumber: string;
  vehicleType: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  startTime: Timestamp;
  endTime: Timestamp;
  distance: number;
  fare: number;
  status: 'completed' | 'cancelled' | 'no-show';
  userRating?: number;
  userReview?: string;
  ratedAt?: Timestamp;
}

/**
 * Get ride history for a student
 */
export const getRideHistory = async (studentId: string, limit: number = 10) => {
  try {
    const tripsRef = collection(db, 'trips');
    const q = query(
      tripsRef,
      where('studentId', '==', studentId),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);
    const rides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by date descending and limit
    return rides
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit) as RideHistoryItem[];
  } catch (error) {
    console.error('Error getting ride history:', error);
    throw error;
  }
};

// ============================================
// Driver Rating
// ============================================

/**
 * Rate a driver
 */
export const rateDriver = async (
  tripId: string,
  driverId: string,
  rating: number,
  review?: string
) => {
  try {
    const tripRef = doc(db, 'trips', tripId);

    await updateDoc(tripRef, {
      userRating: rating,
      userReview: review || '',
      ratedAt: Timestamp.now(),
    });

    // Update driver's average rating
    const driverRef = doc(db, 'drivers', driverId);
    const driverDoc = await (await import('firebase/firestore')).getDoc(driverRef);
    
    if (driverDoc.exists()) {
      const driverData = driverDoc.data();
      const totalRatings = (driverData.totalRatings || 0) + 1;
      const totalScore = (driverData.totalScore || 0) + rating;
      const avgRating = totalScore / totalRatings;

      await updateDoc(driverRef, {
        totalRatings,
        totalScore,
        averageRating: avgRating,
      });
    }

    console.log(`Driver ${driverId} rated ${rating}/5`);
  } catch (error) {
    console.error('Error rating driver:', error);
    throw error;
  }
};

// ============================================
// Firestore Schema Reference
// ============================================

/*
DATABASE STRUCTURE:

trips/
  {tripId}/
    studentId: string
    driverId: string
    driverName: string
    driverRating: number
    vehicleNumber: string
    vehicleType: string
    pickupLocation: { lat, lng }
    dropoffLocation: { lat, lng }
    startTime: Timestamp
    endTime: Timestamp
    status: 'active' | 'completed' | 'cancelled'
    driverLocation:
      latitude: number
      longitude: number
      speed: number
      heading: number
      accuracy: number
      timestamp: Timestamp
    routeHistory: [{latitude, longitude, timestamp}]
    fare: number
    distance: number
    userRating: number (1-5)
    userReview: string
    ratedAt: Timestamp

emergencyCalls/
  {callId}/
    tripId: string
    studentId: string
    driverId: string
    timestamp: Timestamp
    callStatus: 'initiated' | 'answered' | 'missed'
    location: { lat, lng }
    notes: string

rideShares/
  {shareId}/
    tripId: string
    studentId: string
    sharedWith: string (email/phone)
    shareTime: Timestamp
    shareLink: string
    expiresAt: Timestamp
    viewedAt: Timestamp

drivers/
  {driverId}/
    name: string
    phone: string
    email: string
    averageRating: number
    totalRatings: number
    totalScore: number
    vehicleNumber: string
    vehicleType: string
    currentLocation: { lat, lng }
    isActive: boolean

users/
  {userId}/
    name: string
    phone: string
    email: string
    role: 'student' | 'driver' | 'admin'
    createdAt: Timestamp
    updatedAt: Timestamp
*/