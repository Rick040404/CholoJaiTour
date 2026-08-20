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
  assignedDriver?: string;
  assignedDriverPhone?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  vehicleAssigned?: string;
  licenseNo?: string;
  status: 'Available' | 'On Trip' | 'Leave';
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OccasionPreset {
  id: string;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  iconName: string;
  themeColor: string;
  badgeText: string;
  badgeTextBn: string;
  imageUrl: string;
  messageEn: string;
  messageBn: string;
  couponCode?: string;
}

export interface OccasionBroadcastState {
  occasionId: string;
  title: string;
  titleBn: string;
  subtitle: string;
  subtitleBn: string;
  imageUrl: string;
  messageEn: string;
  messageBn: string;
  couponCode: string;
  isLiveOnWebsite: boolean;
  updatedAt: string;
}

export interface CustomerVisitRecord {
  tripId: string;
  date: string;
  pickup: string;
  destination: string;
  car: string;
  tripType: string;
  fare?: number;
  advanceAmount?: number;
  status: 'Completed' | 'Confirmed' | 'Advance Paid' | 'Cancelled' | 'In Progress';
  notes?: string;
}

export interface CRMCustomerProfile {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  email?: string;
  category: 'Regular' | 'VIP' | 'Corporate' | 'Tour' | 'Wedding';
  totalTrips: number;
  totalSpent: number;
  lastTripDate: string;
  lastDestination?: string;
  preferredCar?: string;
  notes?: string;
  tags?: string[];
  visitHistory: CustomerVisitRecord[];
  createdAt: string;
  updatedAt: string;
}
