import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Car, Calendar, Clock, MapPin, Phone, User, 
  DollarSign, Check, Sparkles, Mic, MicOff, AlertCircle,
  Tag, Navigation, ArrowRight, ShieldCheck, MessageSquare
} from 'lucide-react';
import { FleetCar, DriverProfile, Language } from '../types';
import { BookingLead, CarDaySchedule } from './AdminPanelModal';
import { formatFullBengaliDate } from '../utils/bengaliCalendar';
import { 
  POPULAR_LOCAL_DESTINATIONS, 
  createBengaliSpeechRecognizer, 
  parseBengaliVoiceCommand,
  isSpeechRecognitionSupported
} from '../utils/voiceRecognition';

interface LocalTripBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: FleetCar[];
  selectedCarId?: string;
  selectedDateStr?: string;
  drivers: DriverProfile[];
  onSaveLocalBooking?: (booking: BookingLead, scheduleData: CarDaySchedule) => void;
  onSaveBooking?: (booking: BookingLead, scheduleData: CarDaySchedule) => void;
  lang: Language;
}

export const LocalTripBookingModal: React.FC<LocalTripBookingModalProps> = ({
  isOpen,
  onClose,
  cars,
  selectedCarId,
  selectedDateStr,
  drivers,
  onSaveLocalBooking,
  onSaveBooking,
  lang,
}) => {
  const isBn = lang === 'bn';

  const defaultCar = cars.find(c => c.id === selectedCarId) || cars[0] || {
    id: 'scorpio-classic',
    name: 'Mahindra Scorpio Classic (9 Seater)',
    nameBn: 'মহিন্দ্রা স্করপিও ক্লাসিক (৯ সিটার)'
  };

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [carId, setCarId] = useState<string>(selectedCarId || defaultCar.id);
  const [dateStr, setDateStr] = useState<string>(selectedDateStr || todayStr());
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickup, setPickup] = useState<string>('Jamalpur, Purba Bardhaman');
  const [destination, setDestination] = useState<string>('Burdwan Station / Town');
  const [timeSlot, setTimeSlot] = useState<string>('08:00 AM');
  const [tripType, setTripType] = useState<string>('Local Day Trip');
  const [isAc, setIsAc] = useState<boolean>(true);
  const [fareEstimate, setFareEstimate] = useState<string>('1200');
  const [advanceAmount, setAdvanceAmount] = useState<string>('500');
  const [notes, setNotes] = useState<string>('');
  
  // Driver assignment
  const [selectedDriverName, setSelectedDriverName] = useState<string>('');
  const [selectedDriverPhone, setSelectedDriverPhone] = useState<string>('');

  // Voice recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  // Sync on prop change
  useEffect(() => {
    if (isOpen) {
      if (selectedCarId) setCarId(selectedCarId);
      if (selectedDateStr) setDateStr(selectedDateStr);
    } else {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
    }
  }, [isOpen, selectedCarId, selectedDateStr]);

  const handleSelectRoutePreset = (route: typeof POPULAR_LOCAL_DESTINATIONS[0]) => {
    setDestination(isBn ? route.nameBn : route.nameEn);
    if (route.nameBn.includes('বিবাহ') || route.nameBn.includes('অনুষ্ঠান')) {
      setTripType('Wedding / Biyebari');
    } else if (route.nameBn.includes('বিমানবন্দর') || route.nameBn.includes('স্টেশন')) {
      setTripType('Airport / Station Transfer');
    } else {
      setTripType('Local Day Trip');
    }
  };

  const handleSelectDriver = (driver: DriverProfile) => {
    setSelectedDriverName(driver.name);
    setSelectedDriverPhone(driver.phone);
  };

  // Bengali Voice Recognition Handler
  const toggleVoiceAssistant = () => {
    if (isListening) {
      if (recognizerRef.current) recognizerRef.current.stop();
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert(isBn ? 'আপনার ব্রাউজারে সরাসরি ভয়েস এক্সেস বন্ধ রয়েছে। গুগল ক্রোম ব্যবহার করুন।' : 'Speech recognition not supported in your browser.');
      return;
    }

    setVoiceTranscript('');
    setVoiceStatus(isBn ? '🎙️ শুনছি... স্পষ্ট করে ট্রিপের সমস্ত তথ্য বলুন...' : '🎙️ Listening... speak full trip details...');

    try {
      const recognizer = createBengaliSpeechRecognizer(
        (text, isFinal) => {
          setVoiceTranscript(text);
          const parsed = parseBengaliVoiceCommand(text, drivers, cars);
          
          if (parsed.customerName) {
            setCustomerName(parsed.customerName);
          }
          if (parsed.customerPhone) {
            setCustomerPhone(parsed.customerPhone);
          }
          if (parsed.pickup) {
            setPickup(parsed.pickup);
          }
          if (parsed.destination) {
            setDestination(parsed.destination);
          }
          if (parsed.timeSlot) {
            setTimeSlot(parsed.timeSlot);
          }
          if (parsed.matchedCarId) {
            setCarId(parsed.matchedCarId);
          }
          if (parsed.dateStr) {
            setDateStr(parsed.dateStr);
          }
          if (parsed.driverName) {
            setSelectedDriverName(parsed.driverName);
            setSelectedDriverPhone(parsed.driverPhone || '');
          }

          const extractedItems = [];
          if (parsed.customerName) extractedItems.push(isBn ? 'যাত্রী' : 'Passenger');
          if (parsed.customerPhone) extractedItems.push(isBn ? 'ফোন' : 'Phone');
          if (parsed.pickup) extractedItems.push(isBn ? 'পিকআপ' : 'Pickup');
          if (parsed.destination) extractedItems.push(isBn ? 'গন্তব্য' : 'Dest');
          if (parsed.timeSlot) extractedItems.push(isBn ? 'সময়' : 'Time');
          if (parsed.driverName) extractedItems.push(isBn ? 'ড্রাইভার' : 'Driver');

          if (extractedItems.length > 0) {
            setVoiceStatus(isBn ? `✓ শনাক্ত: ${extractedItems.join(', ')}` : `✓ Detected: ${extractedItems.join(', ')}`);
          }
        },
        (err) => {
          setVoiceStatus(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      recognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    } catch (e: any) {
      setVoiceStatus(e.message);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    const chosenCar = cars.find(c => c.id === carId) || defaultCar;
    const carFullName = chosenCar.name;

    const bookingId = `loc-${Date.now().toString().slice(-5)}`;
    
    const newBooking: BookingLead = {
      id: bookingId,
      name: customerName,
      phone: customerPhone,
      car: carFullName,
      pickup: pickup || 'Jamalpur, Purba Bardhaman',
      destination: destination || 'Local Trip',
      date: dateStr,
      timeSlot: timeSlot || '08:00 AM',
      tripType: tripType || 'Local Day Trip',
      isAc: isAc,
      fareEstimate: fareEstimate || '1200',
      advanceAmount: advanceAmount || '0',
      status: selectedDriverName ? 'Confirmed' : 'Confirmed',
      assignedDriver: selectedDriverName || undefined,
      assignedDriverPhone: selectedDriverPhone || undefined,
      createdAt: 'Just now',
      notes: notes || 'Local short trip booked from 4-Day Matrix'
    };

    const newSchedule: CarDaySchedule = {
      carId: carId,
      dateStr: dateStr,
      status: selectedDriverName ? 'Driver Assigned' : 'Booked',
      customerName: customerName,
      customerPhone: customerPhone,
      pickup: pickup || 'Jamalpur, Purba Bardhaman',
      destination: destination || 'Local Trip',
      timeSlot: timeSlot || '08:00 AM',
      fareEstimate: fareEstimate || '1200',
      advanceAmount: advanceAmount || '0',
      driverName: selectedDriverName || undefined,
      driverPhone: selectedDriverPhone || undefined,
      tripType: tripType || 'Local Day Trip',
      notes: notes || ''
    };

    if (onSaveLocalBooking) {
      onSaveLocalBooking(newBooking, newSchedule);
    } else if (onSaveBooking) {
      onSaveBooking(newBooking, newSchedule);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-4 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Car className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isBn ? '৪-দিনের ম্যাট্রিক্সে লোকাল ট্রিপ বুকিং' : '4-Day Matrix Local Trip Booking'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Quick Local
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                {isBn ? 'জামালপুর ও বর্ধমান অঞ্চলের তাৎক্ষণিক লোকাল ট্রিপ ও ড্রাইভার বরাদ্দ' : 'Fast local trip dispatch & Bengali voice assignment'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Bengali Voice Assistant Bar */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-3.5 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleVoiceAssistant}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer ${
                  isListening 
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
                }`}
                title={isBn ? 'বাংলা ভয়েস দিয়ে ট্রিপ ও ড্রাইভার পূরণ' : 'Voice fill trip & driver'}
              >
                {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {isBn ? 'বাংলা ভয়েস রিকগনিশন (Voice Auto-Fill)' : 'Bengali Voice Assistant'}
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-indigo-200 text-indigo-900">
                    AI Auto-Fill
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  {voiceStatus || (isBn ? 'মাইকে চাপ দিয়ে বলুন: "বর্ধমান লোকাল ট্রিপ ড্রাইভার রাজু ভাড়া ১২০০"' : 'Tap mic to speak route & driver name in Bengali')}
                </p>
              </div>
            </div>

            {voiceTranscript && (
              <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-1 rounded-xl border border-indigo-200 text-indigo-900 truncate max-w-xs">
                🗣️ "{voiceTranscript}"
              </span>
            )}
          </div>

          {/* Car & Matrix Date Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গাড়ির নাম ও মডেল:' : 'Select Vehicle:'}</label>
              <select
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black focus:border-indigo-600 outline-none bg-slate-50"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.nameBn : c.name} ({c.seats})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রার তারিখ (Date):' : 'Journey Date:'}</label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-600 outline-none"
              />
              <div className="mt-1 text-[10px] font-bold text-indigo-700 font-bengali">
                বাংলা: {formatFullBengaliDate(dateStr)}
              </div>
            </div>
          </div>

          {/* Popular Route Fast Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">
              {isBn ? '⚡ দ্রুত জনপ্রিয় লোকাল রুট নির্বাচন করুন:' : '⚡ Quick Popular Local Routes:'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {POPULAR_LOCAL_DESTINATIONS.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectRoutePreset(r)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                    destination === (isBn ? r.nameBn : r.nameEn)
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{isBn ? r.nameBn : r.nameEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route & Timing Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'পিকআপ স্থান:' : 'Pickup Location:'}</label>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Jamalpur / Station"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'গন্তব্য / ড্রপ স্থান:' : 'Destination Drop:'}</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Burdwan Station / Memari"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রীর নাম *' : 'Customer Name *'}</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Time & AC Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'যাত্রার সময় (Time):' : 'Journey Time:'}</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="08:00 AM"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-indigo-600 outline-none"
              />
              <div className="flex gap-1 mt-1 flex-wrap">
                {['06:00 AM', '08:00 AM', '11:30 AM', '02:30 PM', '06:00 PM', 'Full Day'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeSlot(t)}
                    className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-100 text-[10px] font-bold text-slate-600 cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'এসি সুবিধা (AC / Non-AC):' : 'Comfort Option:'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsAc(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                    isAc ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ❄️ AC Comfort
                </button>
                <button
                  type="button"
                  onClick={() => setIsAc(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                    !isAc ? 'bg-slate-800 text-white border-slate-800 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🌬️ Non-AC
                </button>
              </div>
            </div>
          </div>

          {/* Fare & Advance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'মোট ভাড়া (₹):' : 'Estimated Fare (₹):'}</label>
              <input
                type="text"
                value={fareEstimate}
                onChange={(e) => setFareEstimate(e.target.value)}
                placeholder="1200"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-slate-900 focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{isBn ? 'অগ্রিম গ্রহণ (₹):' : 'Advance Amount (₹):'}</label>
              <input
                type="text"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-emerald-700 focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Assign Driver Section with Voice & Registered Driver List */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-700" />
                <span className="font-extrabold text-slate-900 text-xs">
                  {isBn ? 'ড্রাইভার বরাদ্দ করুন (Assign Driver):' : 'Assign Driver:'}
                </span>
              </div>

              {selectedDriverName && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ {selectedDriverName}
                </span>
              )}
            </div>

            {/* Quick Driver Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {drivers.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">{isBn ? 'কোনো ড্রাইভার নিবন্ধিত নেই।' : 'No drivers registered.'}</p>
              ) : (
                drivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDriver(d)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedDriverName === d.name
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>{d.name}</span>
                  </button>
                ))
              )}
            </div>

            {/* Custom Driver inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                value={selectedDriverName}
                onChange={(e) => setSelectedDriverName(e.target.value)}
                placeholder={isBn ? 'ড্রাইভারের নাম' : 'Driver Name'}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-indigo-600 outline-none"
              />
              <input
                type="tel"
                value={selectedDriverPhone}
                onChange={(e) => setSelectedDriverPhone(e.target.value)}
                placeholder={isBn ? 'ড্রাইভারের ফোন নম্বর' : 'Driver Phone'}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isBn ? '৪-দিনের ম্যাট্রিক্সে বুকিং ও ড্রাইভার কনফার্ম করুন →' : 'Confirm Local Booking & Dispatch →'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
