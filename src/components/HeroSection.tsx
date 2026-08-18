import React from 'react';
import { Phone, MessageSquare, Car, Sparkles, ArrowRight, Star, ShieldCheck, MapPin } from 'lucide-react';
import { BUSINESS_INFO, FLEET_CARS } from '../data/fleetData';
import { Language } from '../types';

interface HeroSectionProps {
  lang: Language;
  onOpenBooking: (carName?: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang, onOpenBooking }) => {
  const isBn = lang === 'bn';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 pt-8 pb-16 border-b border-slate-200">
      
      {/* Background colorful ambient glow spots */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-indigo-300/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-20 right-1/4 w-80 h-80 bg-gradient-to-bl from-amber-300/20 via-orange-300/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-tr from-emerald-300/20 via-teal-200/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          
          {/* Vibrant Top Feature Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-200/80 shadow-2xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              {isBn ? 'অল ইন্ডিয়া প্রিমিয়াম ট্যুর ও কার রেন্টাল সার্ভিস' : 'All-India Premium Tour & Car Rental Services'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              4.9 ★ Google
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            {isBn ? (
              <>
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-bengali">চলো যাই</span> ট্যুর এন্ড ট্রাভেলস্
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Cholo Jai</span> Tour & Travels
              </>
            )}
          </h1>

          <p className="text-lg sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 font-bengali">
            {BUSINESS_INFO.tagline}
          </p>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            {isBn 
              ? 'এরটিগা, রুমিয়ন সাদা, রুমিয়ন সিলভার, স্করপিও ক্লাসিক (৯ সিটার), ওয়াগন-আর ও সুইফট ডিজায়ার — ৪, ৭ ও ৯ সিটের এসি এবং নন-এসি প্রিমিয়াম গাড়ি ভাড়া। অল ইন্ডিয়া ট্যুর, বিয়েবাড়ি, হাসপাতাল ও এয়ারপোর্ট পিক-ড্রপ।'
              : 'Ertiga, Rumion White, Rumion Silver, Scorpio Classic (9-Seater), WagonR, and Swift Dzire. AC & Non-AC 4, 7 & 9 seaters for All-India tours, weddings, airport and family trips.'}
          </p>

          {/* Quick Action Buttons with vivid colours */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onOpenBooking()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <Car className="w-4 h-4" />
              <span>{isBn ? 'অনলাইন গাড়ি বুকিং' : 'Book a Car Online'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={`https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent('Hello Cholo Jai Tour & Travels! I want to inquire about car rates and availability.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>{isBn ? 'হোয়াটসঅ্যাপে কথা বলুন' : 'Instant WhatsApp Quote'}</span>
            </a>

            <a
              href={`tel:${BUSINESS_INFO.phone1}`}
              className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-800 border-2 border-slate-200/80 hover:border-blue-300 text-sm font-bold shadow-xs flex items-center gap-2 transition-all"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{BUSINESS_INFO.phone1}</span>
            </a>
          </div>

        </div>

        {/* Fleet Fast Selection Bar with colourful accents */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-indigo-100 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-indigo-700 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {isBn ? 'আমাদের প্রিমিয়াম গাড়ির বহর' : 'Our Fleet Vehicles'}
              </span>
              <span className="text-slate-500 font-medium hidden sm:inline">
                {isBn ? 'ক্লিক করে যেকোনো গাড়ি বুক করুন' : 'Click any car to book instantly'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {FLEET_CARS.map((car) => {
                // Category color badge
                const catBadge = car.category === 'SUV' 
                  ? 'bg-amber-500 text-white' 
                  : car.category === 'MUV' 
                  ? 'bg-blue-600 text-white' 
                  : car.category === 'Sedan' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-emerald-600 text-white';

                return (
                  <button
                    key={car.id}
                    onClick={() => onOpenBooking(car.name)}
                    className="p-2.5 rounded-2xl bg-gradient-to-b from-slate-50 to-white hover:from-blue-50/60 hover:to-indigo-50/60 border border-slate-200/70 hover:border-indigo-300 hover:shadow-md transition-all text-left group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 mb-2 relative shadow-inner">
                        <img 
                          src={car.image} 
                          alt={car.name} 
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className={`absolute top-1 left-1 ${catBadge} text-[9px] px-1.5 py-0.5 rounded font-extrabold shadow-xs`}>
                          {car.category}
                        </span>
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold backdrop-blur-2xs">
                          {car.seats.split(' ')[0]} {isBn ? 'সিট' : 'Seats'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {car.name}
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-indigo-600 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>{isBn ? 'বুকিং করুন' : 'Book Now'}</span>
                      <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

