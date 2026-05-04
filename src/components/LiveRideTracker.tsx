"use client";

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Phone, Share2, AlertCircle, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed?: number;
}

interface RideData {
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehicleNumber: string;
  vehicleType: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  currentLocation: DriverLocation;
  rideStartTime: number;
  estimatedEndTime: number;
  routeHistory: DriverLocation[];
}

interface StudentLocation {
  latitude: number;
  longitude: number;
}

export default function LiveRideTracker({ rideId }: { rideId: string }) {
  const { toast } = useToast();
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [studentLocation, setStudentLocation] = useState<StudentLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContacts, setShareContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState('');
  const [eta, setEta] = useState<number | null>(null);
  const mapRef = useRef(null);

  // Get student's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setStudentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Unable to get your location. Please enable location access.',
          });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }, []);

  // Fetch ride data and listen for driver location updates
  useEffect(() => {
    const fetchRideData = async () => {
      try {
        // In production, fetch from your Firebase Firestore
        // For now, using mock data
        const mockRideData: RideData = {
          driverId: 'driver_123',
          driverName: 'Raj Kumar',
          driverPhone: '+91-9876543210',
          driverRating: 4.8,
          vehicleNumber: 'DL-01-AB-1234',
          vehicleType: '7-Seater Van',
          startLocation: { lat: 17.3850, lng: 78.4867 }, // Hyderabad
          endLocation: { lat: 17.4009, lng: 78.5384 },
          currentLocation: {
            latitude: 17.3890,
            longitude: 78.4900,
            timestamp: Date.now(),
            speed: 45,
          },
          rideStartTime: Date.now() - 300000, // Started 5 minutes ago
          estimatedEndTime: Date.now() + 600000, // 10 minutes left
          routeHistory: [
            { latitude: 17.3850, longitude: 78.4867, timestamp: Date.now() - 300000 },
            { latitude: 17.3870, longitude: 78.4880, timestamp: Date.now() - 240000 },
            { latitude: 17.3890, longitude: 78.4900, timestamp: Date.now() },
          ],
        };

        setRideData(mockRideData);
        calculateETA(mockRideData);

        // In production, set up real-time listener
        // const rideRef = doc(db, 'trips', rideId);
        // onSnapshot(rideRef, (doc) => {
        //   if (doc.exists()) {
        //     setRideData(doc.data() as RideData);
        //     calculateETA(doc.data() as RideData);
        //   }
        // });
      } catch (error) {
        console.error('Error fetching ride data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load ride information.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRideData();
  }, [rideId]);

  // Calculate ETA using Haversine formula
  const calculateETA = (data: RideData) => {
    if (!studentLocation) return;

    const R = 6371; // Earth's radius in km
    const dLat = ((data.currentLocation.latitude - studentLocation.latitude) * Math.PI) / 180;
    const dLng = ((data.currentLocation.longitude - studentLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((studentLocation.latitude * Math.PI) / 180) *
        Math.cos((data.currentLocation.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Assuming average speed of 40 km/h in urban areas
    const estimatedMinutes = Math.round((distance / 40) * 60);
    setEta(estimatedMinutes);
  };

  // Emergency call
  const handleEmergencyCall = () => {
    if (!rideData) return;
    
    // Trigger native call
    window.location.href = `tel:${rideData.driverPhone}`;
    
    toast({
      title: 'Emergency Call',
      description: `Calling ${rideData.driverName}...`,
    });

    // Log emergency call to database
    // In production, log this to Firestore for safety
    console.log(`Emergency call initiated to driver ${rideData.driverId} at ${new Date().toISOString()}`);
  };

  // Share ride with family
  const handleShareRide = async () => {
    if (newContact.trim()) {
      setShareContacts([...shareContacts, newContact]);
      setNewContact('');

      // In production, send share notification via Firebase
      // await addDoc(collection(db, 'rideShares'), {
      //   rideId,
      //   sharedWith: newContact,
      //   shareTime: new Date(),
      //   rideData
      // });

      toast({
        title: 'Ride Shared',
        description: `Ride details shared with ${newContact}`,
      });
    }
  };

  // Remove shared contact
  const handleRemoveContact = (contact: string) => {
    setShareContacts(shareContacts.filter((c) => c !== contact));
  };

  // Copy share link
  const handleCopyShareLink = async () => {
    const shareLink = `${window.location.origin}/track/${rideId}`;
    await navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Link Copied',
      description: 'Share link copied to clipboard!',
    });
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-foreground font-semibold">Loading ride information...</p>
        </div>
      </div>
    );
  }

  if (!rideData || !studentLocation) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Unable to Load Ride</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load your ride information. Please check your connection and try again.
          </p>
          <Button className="w-full btn-primary">Reload</Button>
        </Card>
      </div>
    );
  }

  const routeCoordinates = rideData.routeHistory.map((loc) => [
    loc.latitude,
    loc.longitude,
  ] as [number, number]);

  return (
    <div className="w-full h-screen flex flex-col bg-background text-foreground">
      {/* Map */}
      <div className="flex-1 relative z-10">
        <MapContainer
          center={[rideData.currentLocation.latitude, rideData.currentLocation.longitude]}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route */}
          <Polyline positions={routeCoordinates} color="blue" weight={3} opacity={0.6} />

          {/* Start Point */}
          <Marker position={[rideData.startLocation.lat, rideData.startLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Pickup Location</p>
                <p className="text-muted-foreground">Your ride starts here</p>
              </div>
            </Popup>
          </Marker>

          {/* End Point */}
          <Marker position={[rideData.endLocation.lat, rideData.endLocation.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Destination</p>
                <p className="text-muted-foreground">Drop-off location</p>
              </div>
            </Popup>
          </Marker>

          {/* Driver Current Location */}
          <Marker
            position={[rideData.currentLocation.latitude, rideData.currentLocation.longitude]}
            icon={
              new L.Icon({
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiNGNTlFMEIiIHJ4PSI0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn4u3PC90ZXh0Pjwvc3ZnPg==',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
              })
            }
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{rideData.driverName}</p>
                <p className="text-muted-foreground">{rideData.vehicleNumber}</p>
                <p className="text-xs">Speed: {rideData.currentLocation.speed} km/h</p>
              </div>
            </Popup>
          </Marker>

          {/* Student Location */}
          {studentLocation && (
            <Marker
              position={[studentLocation.latitude, studentLocation.longitude]}
              icon={
                new L.Icon({
                  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzhCNUNGNiIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjgiIGZpbGw9IndoaXRlIi8+PC9zdmc+',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                  popupAnchor: [0, -16],
                })
              }
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Your Location</p>
                  <p className="text-muted-foreground">This is where you are</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Bottom Sheet - Driver & Ride Info */}
      <div className="bg-card border-t border-white/10 rounded-t-3xl shadow-2xl p-6 space-y-6 max-h-[50vh] overflow-y-auto">
        {/* Driver Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-black text-foreground">{rideData.driverName}</h2>
              <div className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-bold text-primary">{rideData.driverRating}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {rideData.vehicleType} • {rideData.vehicleNumber}
            </p>

            {/* ETA and Distance */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {eta ? `${eta} min` : 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 px-3 py-2 rounded-lg">
                <MapPin className="h-4 w-4 text-secondary" />
                <span className="font-semibold text-foreground">On the way</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Emergency Call Button */}
            <button
              onClick={handleEmergencyCall}
              className="p-3 bg-destructive hover:bg-destructive/90 text-white rounded-full shadow-lg transition-all active:scale-95"
              title="Emergency Call"
            >
              <Phone className="h-6 w-6" />
            </button>

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-3 bg-primary hover:bg-primary/90 text-black rounded-full shadow-lg transition-all active:scale-95"
              title="Share Ride"
            >
              <Share2 className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Ride Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>Ride Progress</span>
            <span>
              {Math.round((rideData.routeHistory.length / 10) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{
                width: `${Math.round((rideData.routeHistory.length / 10) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Shared With Section */}
        {shareContacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Shared With ({shareContacts.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {shareContacts.map((contact) => (
                <div
                  key={contact}
                  className="flex items-center gap-2 bg-secondary/10 px-3 py-2 rounded-full text-xs font-semibold"
                >
                  <span>{contact}</span>
                  <button
                    onClick={() => handleRemoveContact(contact)}
                    className="text-secondary hover:text-secondary/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div className="w-full bg-card rounded-t-3xl p-6 space-y-4 animate-slide-in-top">
              <h3 className="text-xl font-black text-foreground">Share Your Ride</h3>

              {/* Copy Link Button */}
              <Button
                onClick={handleCopyShareLink}
                className="w-full btn-primary"
              >
                📋 Copy Share Link
              </Button>

              {/* Add Contact */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Add Family/Friend
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="input-base flex-1"
                  />
                  <Button
                    onClick={handleShareRide}
                    className="btn-secondary px-6"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowShareModal(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}