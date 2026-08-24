import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Sparkles, Check, X, Car, User, 
  Phone, Clock, AlertCircle, MessageSquare,
  MapPin, FileText, CheckCircle2,
  Wand2, Globe, Smartphone
} from 'lucide-react';
import { DriverProfile, BookingLead, Language, FleetCar } from '../types';
import { 
  createBengaliSpeechRecognizer, 
  parseBengaliVoiceCommand, 
  VoiceParsedResult,
  isSpeechRecognitionSupported,
  isMobileDevice,
  POPULAR_LOCAL_DESTINATIONS,
  QUICK_VOICE_TEMPLATES,
  generateDriverWhatsAppDispatchSlip
} from '../utils/voiceRecognition';

interface BengaliVoiceTripBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: DriverProfile[];
  cars: FleetCar[];
  selectedCarId?: string;
  selectedDateStr?: string;
  targetBooking?: BookingLead | null;
  onSaveVoiceBooking: (
    booking: BookingLead,
    driverName?: string,
    driverPhone?: string
  ) => void;
  lang: Language;
}

export const BengaliVoiceAssignModal: React.FC<BengaliVoiceTripBookingModalProps> = ({
  isOpen,
  onClose,
  drivers,
  cars,
  selectedCarId,
  selectedDateStr,
  targetBooking,
  onSaveVoiceBooking,
  lang
}) => {
  const isBn = lang === 'bn';
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [customVoiceInput, setCustomVoiceInput] = useState<string>('');
  const [, setParsedResult] = useState<VoiceParsedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'bn-IN' | 'en-IN'>('bn-IN');
  const isMobile = isMobileDevice();

  // Dedicated Form fields populated directly from voice
  const [chosenCarId, setChosenCarId] = useState<string>(selectedCarId || cars[0]?.id || 'wagonr');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickup, setPickup] = useState<string>('জামালপুর (Jamalpur)');
  const [destination, setDestination] = useState<string>('বর্ধমান স্টেশন (Burdwan Station)');
  const [timeSlot, setTimeSlot] = useState<string>('07:00 AM');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const recognizerRef = useRef<any>(null);
  const isSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!isOpen) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      setTranscript('');
      setInterimText('');
      setCustomVoiceInput('');
      setParsedResult(null);
      setErrorMsg(null);
      setSuccessNotice(null);
      return;
    }

    // Set initial defaults
    if (selectedCarId) setChosenCarId(selectedCarId);
    if (targetBooking) {
      setCustomerName(targetBooking.name || '');
      setCustomerPhone(targetBooking.phone || '');
      setPickup(targetBooking.pickup || 'Jamalpur');
      setDestination(targetBooking.destination || 'Burdwan');
      setTimeSlot(targetBooking.timeSlot || '07:00 AM');
      setDriverName(targetBooking.assignedDriver || '');
      setDriverPhone(targetBooking.assignedDriverPhone || '');
      setNotes(targetBooking.notes || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setPickup('জামালপুর (Jamalpur)');
      setDestination('বর্ধমান স্টেশন (Burdwan Station)');
      setTimeSlot('07:00 AM');
      setDriverName('');
      setDriverPhone('');
      setNotes('');
    }

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, [isOpen, selectedCarId, targetBooking]);

  const applyParsedDataToState = (parsed: VoiceParsedResult) => {
    setParsedResult(parsed);

    if (parsed.customerName) setCustomerName(parsed.customerName);
    if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
    if (parsed.pickup) setPickup(parsed.pickup);
    if (parsed.destination) setDestination(parsed.destination);
    if (parsed.timeSlot) setTimeSlot(parsed.timeSlot);
    if (parsed.matchedCarId) setChosenCarId(parsed.matchedCarId);
    if (parsed.driverName) setDriverName(parsed.driverName);
    if (parsed.driverPhone) setDriverPhone(parsed.driverPhone);

    const extracted = [];
    if (parsed.customerName) extracted.push(isBn ? `যাত্রী (${parsed.customerName})` : `Passenger (${parsed.customerName})`);
    if (parsed.customerPhone) extracted.push(isBn ? `ফোন (${parsed.customerPhone})` : `Phone (${parsed.customerPhone})`);
    if (parsed.pickup) extracted.push(isBn ? `পিকআপ (${parsed.pickup})` : `Pickup (${parsed.pickup})`);
    if (parsed.destination) extracted.push(isBn ? `গন্তব্য (${parsed.destination})` : `Destination (${parsed.destination})`);
    if (parsed.timeSlot) extracted.push(isBn ? `সময় (${parsed.timeSlot})` : `Time (${parsed.timeSlot})`);
    if (parsed.driverName) extracted.push(isBn ? `ড্রাইভার (${parsed.driverName})` : `Driver (${parsed.driverName})`);

    if (extracted.length > 0) {
      setSuccessNotice(isBn ? `✓ ফিল্ডে পূরণ হয়েছে: ${extracted.join(', ')}` : `✓ Detected & filled: ${extracted.join(', ')}`);
    }
  };

  const handleTemplateClick = (phrase: string) => {
    setTranscript(phrase);
    setCustomVoiceInput(phrase);
    setInterimText('');
    const parsed = parseBengaliVoiceCommand(phrase, drivers, cars);
    applyParsedDataToState(parsed);
  };

  const handleManualParse = () => {
    if (!customVoiceInput.trim()) return;
    setTranscript(customVoiceInput);
    const parsed = parseBengaliVoiceCommand(customVoiceInput, drivers, cars);
    applyParsedDataToState(parsed);
  };

  const startListening = async () => {
    setErrorMsg(null);
    setSuccessNotice(null);
    setTranscript('');
    setInterimText('');

    try {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }

      const recognizer = createBengaliSpeechRecognizer(
        (text, isFinal) => {
          setInterimText(text);
          setCustomVoiceInput(text);
          const parsed = parseBengaliVoiceCommand(text, drivers, cars);
          applyParsedDataToState(parsed);
          if (isFinal) {
            setTranscript(text);
          }
        },
        (error) => {
          setErrorMsg(error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        },
        speechLang
      );

      recognizerRef.current = recognizer;
      await recognizer.start();
      setIsListening(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'ভয়েস রিকগনিশন চালু করা যায়নি।');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
  };

  const handleQuickDestinationSelect = (dest: { nameBn: string; nameEn: string }) => {
    setDestination(dest.nameBn);
  };

  const handleSelectQuickDriver = (driver: DriverProfile) => {
    setDriverName(driver.name);
    setDriverPhone(driver.phone);
  };

  // Build current Booking object (clean data in respective fields)
  const buildBookingObject = (): BookingLead => {
    const selectedCar = cars.find((c) => c.id === chosenCarId) || cars[0];
    const finalDate = selectedDateStr || new Date().toISOString().split('T')[0];

    return {
      id: targetBooking?.id || `voice-${Date.now().toString().slice(-6)}`,
      name: customerName || (isBn ? 'ভয়েস বুকিং যাত্রী' : 'Voice Trip Customer'),
      phone: customerPhone || '9153302517',
      car: selectedCar ? `${selectedCar.seats} • ${selectedCar.category}` : '5 Seater AC',
      pickup: pickup || 'Jamalpur, Purba Bardhaman',
      destination: destination || 'Burdwan Station',
      date: finalDate,
      timeSlot: timeSlot || '07:00 AM',
      tripType: destination.includes('বিবাহ') || destination.includes('বিয়ে') ? 'Wedding / Biyebari' : 'Local Day Trip',
      isAc: true,
      fareEstimate: targetBooking?.fareEstimate || '',
      status: driverName ? 'Confirmed' : 'New',
      assignedDriver: driverName || undefined,
      assignedDriverPhone: driverPhone || undefined,
      createdAt: 'Just now',
      notes: notes || undefined
    };
  };

  const handleConfirmAndSaveTrip = () => {
    const booking = buildBookingObject();
    onSaveVoiceBooking(booking, driverName, driverPhone);
    onClose();
  };

  // Send WhatsApp to driver directly (No fare)
  const handleSendWhatsAppToDriver = () => {
    const booking = buildBookingObject();
    const selectedCar = cars.find((c) => c.id === chosenCarId) || cars[0];
    const carDisplay = `${selectedCar.seats} • ${selectedCar.category} (${selectedCar.acType})`;

    const msg = generateDriverWhatsAppDispatchSlip({
      dateFormatted: selectedDateStr || 'Today',
      timeSlot: timeSlot || '07:00 AM',
      customerName: customerName || 'সম্মানিত যাত্রী',
      customerPhone: customerPhone || '9153302517',
      pickup: pickup || 'জামালপুর',
      destination: destination || 'বর্ধমান স্টেশন',
      vehicleCategory: carDisplay,
      driverName: driverName || undefined,
      notes: notes || undefined
    });

    const targetPhone = driverPhone ? driverPhone.replace(/\D/g, '') : '9153302517';
    const cleanNumber = targetPhone.length === 10 ? `91${targetPhone}` : targetPhone;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;

    // Save booking first then open WhatsApp
    onSaveVoiceBooking(booking, driverName, driverPhone);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-4 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
              <Mic className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isBn ? 'ভয়েস ট্রিপ বুকিং ও অটো-ইনপুট' : 'Voice Trip Booking & Auto-Fill'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Mobile & Web
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                {isBn
                  ? 'মুখে বলুন: যাত্রীর নাম, মোবাইল নম্বর, পিকআপ ও গন্তব্য'
                  : 'Speak passenger name, phone, pickup & destination'}
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

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Language Selector Pill & Mobile Tip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'ভয়েস ভাষা:' : 'Voice Language:'}</span>
              <button
                type="button"
                onClick={() => setSpeechLang('bn-IN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  speechLang === 'bn-IN' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                বাংলা (bn-IN)
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang('en-IN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  speechLang === 'en-IN' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                English (en-IN)
              </button>
            </div>

            {isMobile && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                <Smartphone className="w-3 h-3 text-indigo-600" />
                <span>মোবাইল প্রস্তুত</span>
              </span>
            )}
          </div>

          {/* Quick Bengali Voice Templates (1-Tap Test & Dictate) */}
          <div className="space-y-1.5 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isBn ? '১-ট্যাপ রেডি ভয়েস স্যাম্পল (ক্লিক করলেই সব ফিল্ড পূরণ হবে):' : '1-Tap Voice Templates (Auto-fills all inputs):'}</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                {selectedDateStr || 'Today'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {QUICK_VOICE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTemplateClick(tmpl.phrase)}
                  className="text-left px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold border border-indigo-100 hover:border-indigo-600 transition-all flex items-center justify-between gap-2 shadow-2xs group cursor-pointer"
                >
                  <span className="truncate">{tmpl.label}</span>
                  <span className="text-[10px] text-indigo-600 group-hover:text-amber-300 shrink-0 font-black">
                    {isBn ? 'ইনপুট করুন ➔' : 'Fill ➔'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Microphone Center Section */}
          <div className="text-center py-2 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="relative mb-2">
              {isListening && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-indigo-500/25 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-blue-500/15 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 cursor-pointer touch-manipulation ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-red-500/30 ring-4 ring-red-200'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-indigo-500/30 hover:brightness-110'
                }`}
              >
                {isListening ? (
                  <Mic className="w-9 h-9 animate-bounce" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full ${
                isListening 
                  ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' 
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {isListening 
                  ? (isBn ? '🎙️ শুনছি... স্পষ্ট করে মুখে বলুন' : '🎙️ Listening... Speak now') 
                  : (isBn ? '👉 মাইকে ট্যাপ করে মুখে বলুন' : '👉 Tap Mic to start speaking')}
              </span>
            </div>

            {/* Mobile Helpful Hint */}
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              💡 {isBn ? 'মোবাইলে মাইকে ট্যাপ করলে পারমিশন চাইলে "Allow" করুন। অথবা কীবোর্ডের মাইক দিয়েও লিখতে পারেন।' : 'On mobile, tap Allow for microphone access, or use your keyboard microphone.'}
            </p>
          </div>

          {/* Real-time Spoken Transcript & Manual Text Input Area */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold">
              <span>{isBn ? 'ভয়েস টেক্সট / লিখুন অথবা পেস্ট করুন:' : 'Voice Transcript / Paste text:'}</span>
              {isListening && <span className="flex items-center gap-1 text-emerald-400 animate-pulse font-bold">● REC LIVE</span>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customVoiceInput}
                onChange={(e) => {
                  setCustomVoiceInput(e.target.value);
                  if (e.target.value.length > 5) {
                    const parsed = parseBengaliVoiceCommand(e.target.value, drivers, cars);
                    applyParsedDataToState(parsed);
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualParse(); }}
                placeholder={isBn ? 'যেমন: যাত্রী রতন দাস ফোন ৯১৫৩৩০২৫১৭ জামালপুর থেকে বর্ধমান...' : 'Type or speak: passenger name, phone, pickup, destination...'}
                className="flex-1 bg-slate-800 text-white font-sans text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={handleManualParse}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span>{isBn ? 'অটো-ফিল' : 'Auto-Fill'}</span>
              </button>
            </div>

            {(interimText || transcript) && (
              <p className="text-xs font-sans text-emerald-300 pt-1 border-t border-slate-800">
                🗣️ "{interimText || transcript}"
              </p>
            )}
          </div>

          {/* Success Notice / Extracted feedback */}
          {successNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Voice Detected Summary Card with Dedicated Edit Fields */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBn ? 'নির্দিষ্ট ফিল্ডে পূরণ হওয়া বিবরণ (পরিবর্তনযোগ্য):' : 'Auto-Filled Field Details (Editable):'}</span>
              </span>
            </div>

            {/* 1. Customer Details (Passenger Name & Phone) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-white border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isBn ? 'যাত্রীর নাম (Passenger Name):' : 'Passenger Name:'}</span>
                  </span>
                  {customerName && <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.2 rounded">✓ পূরণ হয়েছে</span>}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isBn ? 'যেমন: বিকাশ ঘোষ / অমল বাবু / যে কোনো নাম' : 'e.g. Rahul Sen / Amit Mondal'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isBn ? 'মোবাইল নম্বর (Phone):' : 'Mobile Number:'}</span>
                  </span>
                  {customerPhone && <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.2 rounded">✓ পূরণ হয়েছে</span>}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="১০ ডিজিট মোবাইল নম্বর"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/50 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* 2. Route (From Location ➔ To Destination) */}
            <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'পিকআপ (From Location):' : 'Pickup (From):'}</span>
                    </span>
                    {pickup && <span className="text-[10px] text-emerald-700 font-black bg-emerald-100 px-1.5 py-0.2 rounded">✓ পূরণ হয়েছে</span>}
                  </label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="যেমন: জামালপুর বাজার / স্টেশন"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isBn ? 'গন্তব্য (To Destination):' : 'Destination (To):'}</span>
                    </span>
                    {destination && <span className="text-[10px] text-indigo-700 font-black bg-indigo-100 px-1.5 py-0.2 rounded">✓ পূরণ হয়েছে</span>}
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="যেমন: বর্ধমান স্টেশন / মেমারি / কলকাতা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-black text-indigo-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Popular Local Destination Quick Chips (No Fare) */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 uppercase">{isBn ? 'জনপ্রিয় লোকাল গন্তব্য (ট্যাপ করুন):' : 'Quick Destinations:'}</span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {POPULAR_LOCAL_DESTINATIONS.slice(0, 7).map((dest, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickDestinationSelect(dest)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                        destination.includes(dest.nameBn) || destination.includes(dest.nameEn)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      {dest.nameBn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Vehicle & Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isBn ? 'গাড়ির ক্যাটাগরি / সিট:' : 'Vehicle Category / Seats:'}</span>
                </label>
                <select
                  value={chosenCarId}
                  onChange={(e) => setChosenCarId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.seats} • {c.category} ({c.acType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isBn ? 'ট্রিপের সময়:' : 'Time Slot:'}</span>
                  </span>
                  {timeSlot && <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">{timeSlot}</span>}
                </label>
                <input
                  type="text"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  placeholder="যেমন: 07:00 AM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* 4. Assigned Driver */}
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-600" />
                  <span>{isBn ? 'ড্রাইভার বরাদ্দ:' : 'Assign Driver:'}</span>
                </span>
                {driverName && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {driverName} {driverPhone ? `(${driverPhone})` : ''}
                  </span>
                )}
              </div>

              {/* Quick Driver Buttons */}
              {drivers.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {drivers.slice(0, 5).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectQuickDriver(d)}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        driverName === d.name
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="ড্রাইভারের নাম"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none"
                />
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="ড্রাইভারের মোবাইল"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Optional Custom Note (Blank by default, not filled with transcript) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" />
                <span>{isBn ? 'বিশেষ মন্তব্য / নোট (ঐচ্ছিক):' : 'Special Notes (Optional):'}</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isBn ? 'যেমন: লাগেজ বেশি আছে / এসি চালু রাখবেন' : 'e.g. Extra luggage / Keep AC on'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 outline-none"
              />
            </div>

          </div>

        </div>

        {/* Action Buttons Footer with Direct WhatsApp Dispatch */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2 shrink-0">
          {/* Send to Driver on WhatsApp button */}
          <button
            type="button"
            onClick={handleSendWhatsAppToDriver}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>{isBn ? 'ড্রাইভারকে হোয়াটসঅ্যাপে পাঠান' : 'Send to Driver via WhatsApp'}</span>
          </button>

          {/* Direct Save Button */}
          <button
            type="button"
            onClick={handleConfirmAndSaveTrip}
            className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isBn ? 'বুকিং সেভ করুন' : 'Save Booking'}</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
        </div>

      </div>
    </div>
  );
};

