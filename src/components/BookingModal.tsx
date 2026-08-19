import React, { useState } from 'react';
import { X, Car, Calendar, MapPin, Phone, MessageSquare, Wind, Check, User, Clock } from 'lucide-react';
import { FLEET_CARS, BUSINESS_INFO } from '../data/fleetData';
import { Language } from '../types';
import { syncSaveBooking } from '../utils/syncService';
import { BookingLead } from './AdminPanelModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  preselectedCar?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  lang,
  preselectedCar = ''
}) => {
  const isBn = lang === 'bn';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [carName, setCarName] = useState(preselectedCar || FLEET_CARS[0].name);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [tripType, setTripType] = useState('Outstation Tour');
  const [isAc, setIsAc] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedMessage = `*New Car Rental Booking Request*
--------------------------------
🚗 *Car Selected:* ${carName}
👤 *Customer Name:* ${name || 'Valued Traveler'}
📞 *Phone Number:* ${phone || 'Provided upon contact'}
📍 *Pickup Location:* ${pickup || 'Jamalpur / Bardhaman Area'}
🎯 *Destination:* ${destination || 'Outstation / Local'}
📅 *Date of Journey:* ${date || 'Flexible / Upcoming'}
🔄 *Trip Type:* ${tripType}
❄️ *AC Option:* ${isAc ? 'AC' : 'Non-AC'}
📝 *Special Notes:* ${notes || 'Standard booking'}
--------------------------------
Booking through Cholo Jai Tour & Travels Official Portal`;

    // Save to local storage for Admin Panel future bookings
    try {
      const savedBookingsStr = localStorage.getItem('cholo_jai_admin_bookings');
      const currentBookings = savedBookingsStr ? JSON.parse(savedBookingsStr) : [];
      const newLead: BookingLead = {
        id: `b-${Date.now().toString().slice(-4)}`,
        name: name || 'Valued Customer',
        phone: phone || '9153302517',
        car: carName,
        pickup: pickup || 'Jamalpur / Bardhaman Area',
        destination: destination || 'Outstation',
        date: date || new Date().toISOString().split('T')[0],
        timeSlot: 'Morning / Flexible',
        tripType: tripType,
        isAc: isAc,
        status: 'New',
        createdAt: 'Just now (Online Inquiry)',
        notes: notes || 'Website lead inquiry'
      };
      localStorage.setItem('cholo_jai_admin_bookings', JSON.stringify([newLead, ...currentBookings]));
      // Multi-device cloud sync
      syncSaveBooking(newLead);
    } catch (err) {
      console.error('Error saving lead locally:', err);
    }

    const whatsappUrl = `https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(formattedMessage)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {isBn ? 'গাড়ি বুকিং ইনকোয়ারি' : 'Car Booking Inquiry'}
              </h3>
              <p className="text-xs text-blue-100 font-bengali font-semibold">
                {isBn ? 'চলো যাই ট্যুর এন্ড ট্রাভেলস্ • দ্রুত নিশ্চয়তা' : 'Cholo Jai Tour & Travels • Instant Booking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Car Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'পছন্দের গাড়ি নির্বাচন করুন' : 'Select Car'}
            </label>
            <select
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {FLEET_CARS.map((car) => (
                <option key={car.id} value={car.name}>
                  {car.name} ({car.seats} - {car.category})
                </option>
              ))}
            </select>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'আপনার নাম' : 'Your Name'}
              </label>
              <input
                type="text"
                required
                placeholder={isBn ? 'নাম লিখুন' : 'e.g. Rahul Sharma'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <input
                type="tel"
                required
                placeholder={isBn ? 'মোবাইল নম্বর' : 'e.g. 9876543210'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Pickup & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'পিকআপ স্থান' : 'Pickup Location'}
              </label>
              <input
                type="text"
                required
                placeholder={isBn ? 'যেমন: জামালপুর / মেমারি / বর্ধমান' : 'e.g. Jamalpur / Bardhaman'}
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'গন্তব্য স্থান' : 'Destination'}
              </label>
              <input
                type="text"
                required
                placeholder={isBn ? 'যেমন: দিঘা / কলকাতা / দার্জিলিং' : 'e.g. Digha / Kolkata / Darjeeling'}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Trip Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'যাত্রার তারিখ' : 'Journey Date'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isBn ? 'যাত্রার ধরণ' : 'Trip Type'}
              </label>
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Outstation Tour">All India / Outstation Tour</option>
                <option value="One Way Drop">One Way Drop</option>
                <option value="Round Trip (Same Day)">Round Trip (Same Day)</option>
                <option value="Wedding / Ceremony Rental">Wedding / Ceremony Event</option>
                <option value="Airport Pick & Drop">Airport Pick & Drop</option>
                <option value="Hospital / Emergency">Hospital Medical Visit</option>
              </select>
            </div>
          </div>

          {/* AC / Non-AC toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'এসি পছন্দ' : 'AC Preference'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAc(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  isAc ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                ✓ {isBn ? 'এসি (AC)' : 'AC (Chilled)'}
              </button>
              <button
                type="button"
                onClick={() => setIsAc(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  !isAc ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {isBn ? 'নন-এসি (Non-AC)' : 'Non-AC'}
              </button>
            </div>
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {isBn ? 'অতিরিক্ত কোনো অনুরোধ (ঐচ্ছিক)' : 'Special Requests (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: রুফ লাগেজ ক্যারিয়ার প্রয়োজন, বরের গাড়ি সাজানো' : 'e.g. Need roof luggage carrier, wedding flower decoration'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>{isBn ? 'হোয়াটসঅ্যাপে বুকিং পাঠান' : 'Send Booking on WhatsApp'}</span>
            </button>

            <a
              href={`tel:${BUSINESS_INFO.phone1}`}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>{isBn ? 'বা সরাসরি কল করুন (৯১৫৩৩০২৫১৭)' : `Or Call Directly (${BUSINESS_INFO.phone1})`}</span>
            </a>
          </div>

        </form>

      </div>
    </div>
  );
};
