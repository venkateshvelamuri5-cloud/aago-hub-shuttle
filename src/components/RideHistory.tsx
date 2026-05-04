"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  MapPinned,
  MessageSquare,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';

interface RideHistoryItem {
  id: string;
  driverId: string;
  driverName: string;
  driverPhoto?: string;
  driverRating: number;
  vehicleNumber: string;
  vehicleType: string;
  from: string;
  to: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  startTime: number;
  endTime: number;
  distance: number;
  fare: number;
  status: 'completed' | 'cancelled' | 'no-show';
  userRating?: number;
  userReview?: string;
  timestamp: number;
}

interface RideHistoryProps {
  userId: string;
}

export default function RideHistory({ userId }: RideHistoryProps) {
  const [rides, setRides] = useState<RideHistoryItem[]>([
    {
      id: 'ride_1',
      driverId: 'driver_1',
      driverName: 'Raj Kumar',
      driverRating: 4.8,
      vehicleNumber: 'DL-01-AB-1234',
      vehicleType: '7-Seater Van',
      from: 'Hitech City, Hyderabad',
      to: 'Gachibowli, Hyderabad',
      pickupLocation: { lat: 17.3850, lng: 78.4867 },
      dropoffLocation: { lat: 17.4009, lng: 78.5384 },
      startTime: Date.now() - 86400000 * 2,
      endTime: Date.now() - 86400000 * 2 + 1200000,
      distance: 12.5,
      fare: 250,
      status: 'completed',
      userRating: 5,
      userReview: 'Great ride! Driver was very professional and the vehicle was clean.',
      timestamp: Date.now() - 86400000 * 2,
    },
    {
      id: 'ride_2',
      driverId: 'driver_2',
      driverName: 'Priya Sharma',
      driverRating: 4.6,
      vehicleNumber: 'TS-09-XY-5678',
      vehicleType: '7-Seater Van',
      from: 'Madhapur, Hyderabad',
      to: 'Begumpet, Hyderabad',
      pickupLocation: { lat: 17.3910, lng: 78.5030 },
      dropoffLocation: { lat: 17.3682, lng: 78.4565 },
      startTime: Date.now() - 86400000 * 5,
      endTime: Date.now() - 86400000 * 5 + 900000,
      distance: 8.2,
      fare: 180,
      status: 'completed',
      userRating: 4,
      userReview: 'Good service. Vehicle was comfortable.',
      timestamp: Date.now() - 86400000 * 5,
    },
    {
      id: 'ride_3',
      driverId: 'driver_3',
      driverName: 'Ahmed Khan',
      driverRating: 4.9,
      vehicleNumber: 'DL-02-CD-9012',
      vehicleType: '7-Seater Van',
      from: 'IKEA, Hyderabad',
      to: 'Ameerpet, Hyderabad',
      pickupLocation: { lat: 17.4169, lng: 78.5560 },
      dropoffLocation: { lat: 17.3600, lng: 78.4700 },
      startTime: Date.now() - 86400000 * 8,
      endTime: Date.now() - 86400000 * 8 + 1500000,
      distance: 15.8,
      fare: 320,
      status: 'completed',
      userRating: 5,
      userReview: 'Excellent service! Very friendly driver.',
      timestamp: Date.now() - 86400000 * 8,
    },
  ]);

  const [selectedRide, setSelectedRide] = useState<RideHistoryItem | null>(null);
  const [editingRideId, setEditingRideId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editReview, setEditReview] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const completedRides = rides.filter((r) => r.status === 'completed').length;
    const totalDistance = rides.reduce((sum, r) => sum + r.distance, 0);
    const totalSpent = rides.reduce((sum, r) => sum + r.fare, 0);
    const avgRating = rides.filter((r) => r.userRating).length > 0
      ? (rides.reduce((sum, r) => sum + (r.userRating || 0), 0) /
          rides.filter((r) => r.userRating).length).toFixed(1)
      : 0;

    return { completedRides, totalDistance, totalSpent, avgRating };
  }, [rides]);

  // Start rating a ride
  const handleStartRating = (ride: RideHistoryItem) => {
    setSelectedRide(ride);
    setEditingRideId(ride.id);
    setEditRating(ride.userRating || 0);
    setEditReview(ride.userReview || '');
  };

  // Submit rating
  const handleSubmitRating = async (rideId: string) => {
    if (editRating === 0) {
      alert('Please select a rating');
      return;
    }

    // Update ride
    setRides(
      rides.map((r) =>
        r.id === rideId
          ? {
              ...r,
              userRating: editRating,
              userReview: editReview,
            }
          : r
      )
    );

    // In production, save to Firebase
    // await updateDoc(doc(db, 'rides', rideId), {
    //   userRating: editRating,
    //   userReview: editReview,
    //   ratedAt: new Date(),
    // });

    setEditingRideId(null);
    alert('Rating submitted successfully!');
  };

  // Cancel rating
  const handleCancelRating = () => {
    setEditingRideId(null);
    setEditRating(0);
    setEditReview('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 safe-area-inset">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/10 px-6 py-6">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary">
          Ride History
        </h1>
      </div>

      {/* Statistics Cards */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Rides */}
          <Card className="card-elevated p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Rides
            </p>
            <p className="text-3xl font-black text-primary">{stats.completedRides}</p>
          </Card>

          {/* Total Distance */}
          <Card className="card-elevated p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Distance
            </p>
            <p className="text-3xl font-black text-secondary">
              {stats.totalDistance.toFixed(1)} km
            </p>
          </Card>

          {/* Total Spent */}
          <Card className="card-elevated p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Spent
            </p>
            <p className="text-3xl font-black text-primary">₹{stats.totalSpent}</p>
          </Card>

          {/* Avg Rating Given */}
          <Card className="card-elevated p-4 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Avg Rating
            </p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-black text-secondary">{stats.avgRating}</p>
              {stats.avgRating > 0 && <Star className="h-6 w-6 text-secondary fill-secondary" />}
            </div>
          </Card>
        </div>
      </div>

      {/* Rides List */}
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-black uppercase text-foreground tracking-tight mb-6">
          Your Rides
        </h2>

        {rides.map((ride) => (
          <Card
            key={ride.id}
            className="card-elevated p-4 space-y-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedRide(ride)}
          >
            {/* Ride Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-black text-foreground">{ride.driverName}</h3>
                  <Badge className="badge-primary text-xs">{ride.vehicleType}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-semibold">
                  {ride.vehicleNumber}
                </p>
              </div>

              {/* Status & Date */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-2">
                  {format(ride.timestamp, 'MMM dd, yyyy')}
                </p>
                <Badge
                  className={`badge-primary text-xs ${
                    ride.status === 'completed' ? 'bg-green-500/20 border-green-500/30' : ''
                  }`}
                >
                  {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-2 py-2 border-y border-white/5">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">{ride.from}</div>
              </div>
              <div className="flex items-start gap-3">
                <MapPinned className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">{ride.to}</div>
              </div>
            </div>

            {/* Ride Details */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Distance</p>
                <p className="font-black text-foreground">{ride.distance} km</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Fare</p>
                <p className="font-black text-foreground">₹{ride.fare}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Duration</p>
                <p className="font-black text-foreground">
                  {Math.round((ride.endTime - ride.startTime) / 60000)} min
                </p>
              </div>
            </div>

            {/* Rating Section */}
            {ride.status === 'completed' && (
              <div className="space-y-3 pt-2 border-t border-white/5">
                {editingRideId === ride.id ? (
                  // Rating Edit Mode
                  <div className="space-y-3">
                    {/* Star Rating */}
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setEditRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= editRating
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Review Text */}
                    <textarea
                      placeholder="Share your feedback about this ride..."
                      value={editReview}
                      onChange={(e) => setEditReview(e.target.value)}
                      className="input-base w-full resize-none text-sm h-20"
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSubmitRating(ride.id)}
                        className="flex-1 btn-primary text-sm"
                      >
                        Submit Rating
                      </Button>
                      <Button
                        onClick={handleCancelRating}
                        className="flex-1 btn-outline text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : ride.userRating ? (
                  // Display Rating
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < ride.userRating!
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground ml-2">
                          {ride.userRating}/5
                        </span>
                      </div>
                      <button
                        onClick={() => handleStartRating(ride)}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                    {ride.userReview && (
                      <p className="text-xs text-muted-foreground italic">
                        "{ride.userReview}"
                      </p>
                    )}
                  </div>
                ) : (
                  // No Rating Yet
                  <Button
                    onClick={() => handleStartRating(ride)}
                    className="w-full btn-secondary text-sm"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate This Ride
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {rides.length === 0 && (
        <div className="p-6 text-center space-y-4">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-muted-foreground font-semibold">No rides yet</p>
          <p className="text-sm text-muted-foreground opacity-70">
            Book your first ride to get started!
          </p>
          <Button className="btn-primary">Book a Ride</Button>
        </div>
      )}
    </div>
  );
}