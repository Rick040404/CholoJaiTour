import React, { useState } from 'react';
import { Car, Users, Wind, Fuel, Briefcase, Phone, MessageSquare, Check, Sparkles, ArrowRight, Shield, Star, Info, X } from 'lucide-react';
import { FLEET_CARS, BUSINESS_INFO } from '../data/fleetData';
import { FleetCar, Language } from '../types';

interface FleetSectionProps {
  lang: Language;
  onOpenBooking: (carName?: string) => void;
}

export const FleetSection: React.FC<FleetSectionProps> = ({ lang, onOpenBooking }) => {
  const [filter, setFilter] = useState<'all' | '7-9' | '4-5' | 'luxury'>('all');
  const [selectedCar, setSelectedCar] = useState<FleetCar | null>(null);
  const isBn = lang === 'bn';

  const filteredCars = FLEET_CARS.filter(car => {
    if (filter === 'all') return true;
    if (filter === '7-9') return car.category === 'MUV' || car.category === 'SUV';
    if (filter === '4-5') return car.category === 'Sedan' || car.category === 'Hatchback';
    if (filter === 'luxury') return car.id.includes('rumion') || car.id === 'scorpio-classic';
    return true;
  });

  return (
    <section id="fleet" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {isBn ? 'আপনার ভ্রমণের জন্য নিখুঁত গাড়ি নির্বাচন করুন' : 'Select Your Ride from Our Fleet'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              {isBn 
                ? 'এরটিগা, রুমিয়ন সাদা, রুমিয়ন সিলভার, স্করপিও ক্লাসিক, ওয়াগন-আর ও সুইফট ডিজায়ার — এসি ও নন-এসি উভয় বিকল্প সহ।'
                : 'Ertiga, Rumion White, Rumion Silver, Scorpio Classic, WagonR, and Swift Dzire — AC & Non-AC with experienced chauffeurs.'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-xs self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isBn ? 'সব গাড়ি' : 'All Cars'}
            </button>
            <button
              onClick={() => setFilter('7-9')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === '7-9'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isBn ? '৭-৯ সিটার (MUV / SUV)' : '7-9 Seater (MUV/SUV)'}
            </button>
            <button
              onClick={() => setFilter('4-5')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === '4-5'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isBn ? '৪-৫ সিটার (সেডান / হ্যাচ)' : '4-5 Seater (Sedan/Hatch)'}
            </button>
            <button
              onClick={() => setFilter('luxury')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'luxury'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isBn ? 'বিবাহ ও প্রিমিয়াম' : 'Wedding & Luxury'}
            </button>
          </div>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => {
            const isSUV = car.category === 'SUV';
            const isMUV = car.category === 'MUV';
            const isSedan = car.category === 'Sedan';

            const catBadgeStyle = isSUV
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
              : isMUV
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : isSedan
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';

            return (
              <div 
                key={car.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                {/* Image Container */}
                <div className="relative aspect-16/10 bg-slate-950 overflow-hidden">
                  <img 
                    src={car.image} 
                    alt={car.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Highlight Tag */}
                  {car.highlightTag && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>{isBn ? car.highlightTagBn : car.highlightTag}</span>
                    </div>
                  )}

                  {/* Seating Badge */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-md">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isBn ? car.seatsBn : car.seats}</span>
                  </div>

                  {/* Category Pill */}
                  <div className={`absolute top-3 right-3 ${catBadgeStyle} text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-md`}>
                    {car.category}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title & Color */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {car.name}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {isBn ? 'প্রস্তুত' : 'Ready'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-indigo-600 font-bengali mt-0.5">
                        {car.nameBn} • <span className="text-slate-600 font-semibold">{isBn ? car.colorBn : car.color}</span>
                      </p>
                    </div>

                    {/* Quick specs grid with colorful icons */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 text-xs text-slate-700 mb-3 font-medium">
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-50/70">
                        <div className="w-6 h-6 rounded-md bg-sky-500 text-white flex items-center justify-center shrink-0">
                          <Wind className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate text-[11px] font-semibold">{isBn ? car.acTypeBn : car.acType}</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-50/70">
                        <div className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Fuel className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate text-[11px] font-semibold">{car.fuelType}</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-50/70 col-span-2">
                        <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate text-[11px] font-semibold">{car.luggage}</span>
                      </div>
                    </div>

                    {/* Key Features bullets */}
                    <div className="space-y-1.5 mb-4">
                      {(isBn ? car.featuresBn : car.features).slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedCar(car)}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isBn ? 'বিস্তারিত দেখুন' : 'Details'}</span>
                      </button>

                      <button
                        onClick={() => onOpenBooking(car.name)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <span>{isBn ? 'বুকিং করুন' : 'Book Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Car Detailed Modal */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative aspect-16/9 bg-slate-900">
              <img 
                src={selectedCar.image} 
                alt={selectedCar.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedCar(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-xs px-3 py-1 rounded-lg backdrop-blur-xs">
                {selectedCar.category} • {isBn ? selectedCar.seatsBn : selectedCar.seats}
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-slate-900">{selectedCar.name}</h3>
                <p className="text-sm font-semibold text-blue-600 font-bengali">{selectedCar.nameBn}</p>
                <p className="text-sm text-slate-600 mt-2">
                  {isBn ? selectedCar.descriptionBn : selectedCar.description}
                </p>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl mb-4 text-xs">
                <div>
                  <span className="text-slate-500 block">{isBn ? 'সিট সংখ্যা' : 'Seating'}</span>
                  <span className="font-bold text-slate-800">{isBn ? selectedCar.seatsBn : selectedCar.seats}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isBn ? 'এসি বিকল্প' : 'AC Type'}</span>
                  <span className="font-bold text-slate-800">{isBn ? selectedCar.acTypeBn : selectedCar.acType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isBn ? 'রং' : 'Color'}</span>
                  <span className="font-bold text-slate-800">{isBn ? selectedCar.colorBn : selectedCar.color}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isBn ? 'লাগেজ স্পেস' : 'Luggage'}</span>
                  <span className="font-bold text-slate-800">{selectedCar.luggage}</span>
                </div>
              </div>

              {/* All Features */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {isBn ? 'গাড়ির সুযোগ-সুবিধা' : 'Key Inclusions & Features'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(isBn ? selectedCar.featuresBn : selectedCar.features).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ideal For */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {isBn ? 'সেরা ব্যবহারের ক্ষেত্র' : 'Best Suited For'}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(isBn ? selectedCar.idealForBn : selectedCar.idealFor).map((item, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-medium border border-blue-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <a
                  href={`https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(`Hello Cholo Jai Travels! I want to book ${selectedCar.name} for my trip.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>{isBn ? 'হোয়াটসঅ্যাপে বুকিং করুন' : 'Book on WhatsApp'}</span>
                </a>

                <button
                  onClick={() => {
                    const carToBook = selectedCar.name;
                    setSelectedCar(null);
                    onOpenBooking(carToBook);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-colors"
                >
                  <Car className="w-4 h-4" />
                  <span>{isBn ? 'অনলাইন কোটেশন পান' : 'Get Custom Quote'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </section>
  );
};
