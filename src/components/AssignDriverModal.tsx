import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Car, Phone, MessageSquare, Send, CheckCircle2, 
  User, UserPlus, AlertCircle, ArrowRight, Calendar, 
  MapPin, Clock, DollarSign, Check, Mic, MicOff, Sparkles
} from 'lucide-react';
import { BookingLead, DriverProfile, Language } from '../types';
import { syncUpdateBooking, syncSaveDriver } from '../utils/syncService';
import { formatFullBengaliDate } from '../utils/bengaliCalendar';
import { 
  createBengaliSpeechRecognizer, 
  parseBengaliVoiceCommand, 
  isSpeechRecognitionSupported 
} from '../utils/voiceRecognition';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingLead | null;
  drivers: DriverProfile[];
  onAssignSuccess: (updatedBooking: BookingLead) => void;
  onAddDriver?: (newDriver: DriverProfile) => void;
  lang: Language;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  booking,
  drivers,
  onAssignSuccess,
  onAddDriver,
  lang,
}) => {
  const isBn = lang === 'bn';

  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [driverNameInput, setDriverNameInput] = useState<string>(booking?.assignedDriver || '');
  const [driverPhoneInput, setDriverPhoneInput] = useState<string>(booking?.assignedDriverPhone || '');
  const [saveToDirectory, setSaveToDirectory] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Bengali Voice Recognition
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const handleToggleVoice = () => {
    if (isListening) {
      if (recognizerRef.current) recognizerRef.current.stop();
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setError(isBn ? 'আপনার ব্রাউজারে ভয়েস রিকগনিশন সমর্থন করে না।' : 'Voice recognition not supported.');
      return;
    }

    setVoiceNotice(isBn ? 'শুনছি... ড্রাইভারের নাম বলুন...' : 'Listening... speak driver name...');
    setVoiceTranscript('');
    setError(null);

    try {
      const recognizer = createBengaliSpeechRecognizer(
        (text, isFinal) => {
          setVoiceTranscript(text);
          const parsed = parseBengaliVoiceCommand(text, drivers);
          if (parsed.driverName) {
            setDriverNameInput(parsed.driverName);
            if (parsed.driverPhone) setDriverPhoneInput(parsed.driverPhone);
            if (parsed.matchedDriver) setSelectedDriverId(parsed.matchedDriver.id);
            setVoiceNotice(isBn ? `✓ ড্রাইভার ${parsed.driverName} শনাক্ত হয়েছে!` : `✓ Driver ${parsed.driverName} matched!`);
          }
        },
        (err) => {
          setVoiceNotice(err);
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
      setError(e.message);
      setIsListening(false);
    }
  };

  // Sync state when booking changes
  React.useEffect(() => {
    if (booking) {
      setDriverNameInput(booking.assignedDriver || '');
      setDriverPhoneInput(booking.assignedDriverPhone || '');
      // Try to find matching driver
      if (booking.assignedDriver) {
        const match = drivers.find(d => d.name.toLowerCase() === booking.assignedDriver?.toLowerCase());
        if (match) {
          setSelectedDriverId(match.id);
        }
      }
    }
  }, [booking, drivers]);

  if (!isOpen || !booking) return null;

  const handleSelectExistingDriver = (driver: DriverProfile) => {
    setSelectedDriverId(driver.id);
    setDriverNameInput(driver.name);
    setDriverPhoneInput(driver.phone);
    setError(null);
  };

  const generateDriverWhatsAppMessage = (driverName: string): string => {
    const cleanCustomerPhone = booking.phone.replace(/\D/g, '');
    const dateFormatted = new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const bengaliDate = formatFullBengaliDate(booking.date);
    const timeDisplay = booking.timeSlot || 'সকাল / নির্ধারিত সময়ে';

    return (
      `🚕 *CHOLO JAI TOUR & TRAVELS - নতুন ট্রিপ বরাদ্দ (Trip Assignment)* 🚕\n\n` +
      `নমস্কার *${driverName || 'ড্রাইভার বাবু'}*,\n` +
      `আপনার জন্য একটি নতুন ট্রিপ বরাদ্দ করা হয়েছে। নিচে যাত্রীর বিস্তারিত তথ্য দেওয়া হল:\n\n` +
      `👤 *যাত্রীর নাম (Customer):* ${booking.name}\n` +
      `📞 *মোবাইল নম্বর (Mobile):* ${booking.phone} (${cleanCustomerPhone})\n` +
      `📍 *পিকআপ স্থান (Pickup Location):* ${booking.pickup}\n` +
      `🏁 *গন্তব্য (Destination):* ${booking.destination}\n` +
      `🚗 *গাড়ির মডেল (Car Name):* ${booking.car} (${booking.isAc ? 'AC' : 'Non-AC'})\n` +
      `📅 *যাত্রার তারিখ (Date):* ${dateFormatted} (${bengaliDate})\n` +
      `⏰ *যাত্রার সময় (Time):* ${timeDisplay}\n` +
      (booking.notes ? `📝 *বিশেষ নির্দেশাবলী (Notes):* ${booking.notes}\n` : '') +
      `\n` +
      `⚠️ *নির্দেশনা:* সময়মতো গাড়ি নিয়ে পিকআপ পয়েন্টে পৌঁছাবেন এবং কাস্টমারকে ফোন করে যোগাযোগ করবেন। শুভ ও নিরাপদ যাত্রা!\n\n` +
      `🏢 *চলো যাই ট্যুর অ্যান্ড ট্রাভেলস* | 📞 ৯১৫৩৩০২৫১৭`
    );
  };

  const handleAssignAndSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverNameInput.trim()) {
      setError(isBn ? 'ড্রাইভারের নাম প্রদান করুন।' : 'Please enter the driver name.');
      return;
    }

    const cleanDriverPhone = driverPhoneInput.replace(/\D/g, '');
    if (!cleanDriverPhone || cleanDriverPhone.length < 10) {
      setError(isBn ? 'ড্রাইভারের সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন।' : 'Please enter a valid 10-digit mobile number for the driver.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. If saveToDirectory is true and driver doesn't exist yet, save to Drivers collection
      const existing = drivers.find(d => d.phone.replace(/\D/g, '') === cleanDriverPhone);
      if (!existing && saveToDirectory) {
        const newDriver: DriverProfile = {
          id: `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: driverNameInput.trim(),
          phone: driverPhoneInput.trim(),
          vehicleAssigned: booking.car,
          status: 'On Trip',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await syncSaveDriver(newDriver);
        if (onAddDriver) onAddDriver(newDriver);
      }

      // 2. Update booking object with assigned driver
      const updatedBooking: BookingLead = {
        ...booking,
        assignedDriver: driverNameInput.trim(),
        assignedDriverPhone: driverPhoneInput.trim(),
        status: booking.status === 'New' ? 'Confirmed' : booking.status,
      };

      // 3. Save to Firestore
      await syncUpdateBooking(updatedBooking);
      onAssignSuccess(updatedBooking);

      // 4. Open WhatsApp to Driver with pre-formatted message
      const msg = generateDriverWhatsAppMessage(driverNameInput.trim());
      const encodedMsg = encodeURIComponent(msg);
      const waUrl = `https://wa.me/91${cleanDriverPhone.slice(-10)}?text=${encodedMsg}`;
      window.open(waUrl, '_blank');

      onClose();
    } catch (err) {
      console.error('Error assigning driver:', err);
      setError(isBn ? 'ড্রাইভার বরাদ্দ করতে সমস্যা হয়েছে।' : 'Failed to assign driver. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanDriverPhone = driverPhoneInput.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[94vh] overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {isBn ? 'ড্রাইভার বরাদ্দ ও হোয়াটসঅ্যাপে ট্রিপ প্রেরণ' : 'Assign Driver & Send Trip via WhatsApp'}
              </h3>
              <p className="text-xs text-blue-100 font-medium">
                {isBn ? 'গ্রাহকের নাম, লোকেশন, মোবাইল ও গাড়ি ড্রাইভারকে সরাসরি হোয়াটসঅ্যাপে পাঠান' : 'Dispatch customer name, location, mobile & car details to driver'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Trip Summary Card (Customer Name, Location, Mobile, Car) */}
          <div className="bg-gradient-to-br from-purple-50/80 via-blue-50/50 to-slate-50 rounded-2xl border border-purple-200/80 p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
              <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                {isBn ? '📋 ট্রিপের বিবরণ (Trip Details)' : '📋 Trip Details'}
              </span>
              <span className="text-xs font-black text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                {booking.car}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Customer */}
              <div className="bg-white/80 p-2 rounded-xl border border-purple-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{isBn ? '👤 কাস্টমার:' : 'Customer:'}</span>
                <p className="font-extrabold text-slate-900 text-sm">{booking.name}</p>
                <p className="text-blue-600 font-bold">{booking.phone}</p>
              </div>

              {/* Route */}
              <div className="bg-white/80 p-2 rounded-xl border border-purple-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{isBn ? '📍 রুট / লোকেশন:' : 'Route:'}</span>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="truncate">{booking.pickup}</span>
                  <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
                  <span className="truncate text-purple-700">{booking.destination}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {booking.tripType}
                </p>
              </div>

              {/* Date & Time */}
              <div className="bg-white/80 p-2 rounded-xl border border-purple-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{isBn ? '📅 তারিখ ও সময়:' : 'Date & Time:'}</span>
                <p className="font-bold text-slate-900">{booking.date}</p>
                <p className="text-indigo-700 font-extrabold text-[11px]">
                  ⏰ {booking.timeSlot || (isBn ? 'সকাল' : 'Morning')}
                </p>
              </div>

              {/* Fare */}
              <div className="bg-white/80 p-2 rounded-xl border border-purple-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{isBn ? '💰 ভাড়া ও অগ্রিম:' : 'Fare & Advance:'}</span>
                <p className="font-extrabold text-slate-900">
                  {booking.fareEstimate ? `₹${booking.fareEstimate}` : 'Fixed / Meter'}
                </p>
                <p className="text-emerald-700 font-bold text-[11px]">
                  {booking.advanceAmount ? `✓ Adv: ₹${booking.advanceAmount}` : 'Advance: Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Select from Registered Drivers */}
          {drivers.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                {isBn ? '১-ক্লিকে ড্রাইভার নির্বাচন করুন:' : 'Quick-Select Registered Driver:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {drivers.map((d) => {
                  const isSelected = selectedDriverId === d.id || driverPhoneInput === d.phone;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectExistingDriver(d)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold truncate">{d.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{d.phone}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Driver Name & Phone Input Form */}
          <form onSubmit={handleAssignAndSendWhatsApp} className="space-y-3 pt-2">
            
            {/* Bengali Voice Assistant Strip */}
            <div className="bg-indigo-50/80 border border-indigo-200 p-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-bounce shadow-md shadow-rose-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                  title={isBn ? 'বাংলা ভয়েস দিয়ে ড্রাইভারের নাম বলুন' : 'Speak driver name in Bengali'}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                    {isBn ? 'বাংলা ভয়েস রিকগনিশন' : 'Bengali Voice Input'}
                    <span className="text-[9px] font-black bg-indigo-200 text-indigo-900 px-1 rounded">BN</span>
                  </span>
                  <p className="text-[10px] text-slate-600">
                    {voiceNotice || (isBn ? 'মাইকে চাপ দিয়ে ড্রাইভারের নাম বলুন (উদাঃ "ড্রাইভার রাজু")' : 'Tap mic and speak driver name in Bengali')}
                  </p>
                </div>
              </div>

              {voiceTranscript && (
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-indigo-200 text-indigo-900 truncate max-w-[120px]">
                  "{voiceTranscript}"
                </span>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isBn ? 'ড্রাইভারের নাম *' : 'Driver Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={driverNameInput}
                  onChange={(e) => {
                    setDriverNameInput(e.target.value);
                    setSelectedDriverId('');
                  }}
                  placeholder="e.g. Ramesh Ghosh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-xs focus:border-blue-600 outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isBn ? 'ড্রাইভারের হোয়াটসঅ্যাপ মোবাইল *' : 'Driver WhatsApp Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={driverPhoneInput}
                  onChange={(e) => {
                    setDriverPhoneInput(e.target.value);
                    setSelectedDriverId('');
                  }}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-xs focus:border-blue-600 outline-none bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Save to Directory Checkbox */}
            <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={saveToDirectory}
                onChange={(e) => setSaveToDirectory(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>{isBn ? 'এই ড্রাইভারকে ভবিষ্যতে ব্যবহারের জন্য ড্রাইভার ডিরেক্টরিতে সেভ রাখুন' : 'Save this driver to the Drivers Directory for future trips'}</span>
            </label>

            {/* WhatsApp Message Preview Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-black">
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>{isBn ? 'হোয়াটসঅ্যাপে প্রেরিত মেসেজ প্রিভিউ:' : 'WhatsApp Message Preview:'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                {generateDriverWhatsAppMessage(driverNameInput)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer order-2 sm:order-1"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50 order-1 sm:order-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? (isBn ? 'প্রেরণ করা হচ্ছে...' : 'Dispatching...') : (isBn ? 'ড্রাইভার বরাদ্দ করুন ও হোয়াটসঅ্যাপে পাঠান ↗' : 'Assign & Send to Driver WhatsApp ↗')}</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
