export type Language = 'en' | 'bn';

export interface FleetCar {
  id: string;
  name: string;
  nameBn: string;
  category: 'MUV' | 'SUV' | 'Sedan' | 'Hatchback';
  seats: string;
  seatsBn: string;
  color: string;
  colorBn: string;
  acType: string;
  acTypeBn: string;
  image: string;
  luggage: string;
  fuelType: string;
  ratePerKm: number;
  baseDailyRate: number;
  highlightTag?: string;
  highlightTagBn?: string;
  description: string;
  descriptionBn: string;
  features: string[];
  featuresBn: string[];
  idealFor: string[];
  idealForBn: string[];
}

export interface TourPackage {
  id: string;
  destination: string;
  destinationBn: string;
  state: string;
  duration: string;
  durationBn: string;
  distance: string;
  approxDays: number;
  highlight: string;
  highlightBn: string;
  image: string;
  suggestedCar: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  comment: string;
  commentBn: string;
  tripType: string;
  carUsed: string;
  verified: boolean;
}

export interface FareCalculationInput {
  carId: string;
  pickup: string;
  destination: string;
  tripType: 'round' | 'oneway' | 'tour';
  days: number;
  customKm?: number;
  includeAc: boolean;
}

export interface BookingLead {
  id: string;
  name: string;
  phone: string;
  car: string;
  pickup: string;
  destination: string;
  date: string;
  timeSlot?: string;
  tripType: string;
  isAc: boolean;
  advanceAmount?: string;
  fareEstimate?: string;
  status: 'New' | 'Confirmed' | 'Advance Paid' | 'Completed' | 'Cancelled';
  createdAt: string;
  notes?: string;
}
