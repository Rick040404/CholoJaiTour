import React, { useState } from 'react';
import { MapPin, Phone, MessageSquare, Clock, CreditCard, ChevronDown, ChevronUp, ShieldCheck, Mail } from 'lucide-react';
import { BUSINESS_INFO } from '../data/fleetData';
import { Language } from '../types';

interface ContactSectionProps {
  lang: Language;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ lang }) => {
  const isBn = lang === 'bn';
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I book a car in advance?',
      qBn: 'আমি কীভাবে আগে থেকে গাড়ি বুক করব?',
      a: 'You can directly call us at 9153302517 / 6296267402 or message us on WhatsApp with your travel date, destination, and choice of car. We confirm bookings instantly with minimal advance via PhonePe/GPay.',
      aBn: 'আপনি সরাসরি ৯১৫৩৩০২৫১৭ / ৬২৯৬২৬৭৪০২ নম্বরে কল করে অথবা হোয়াটসঅ্যাপে আপনার তারিখ, গন্তব্য ও পছন্দের গাড়ি জানিয়ে বুকিং নিশ্চিত করতে পারেন।'
    },
    {
      q: 'What is included in the fare calculation?',
      qBn: 'ভাড়ার মধ্যে কী কী অন্তর্ভুক্ত থাকে?',
      a: 'The rental includes the car, experienced commercial driver, and standard fuel based on kilometers. Toll taxes, state border permits (if outstation), and parking fees are charged as per actual receipts.',
      aBn: 'ভাড়ার মধ্যে গাড়ি, জ্বালানী এবং অভিজ্ঞ চালক অন্তর্ভুক্ত। টোল ট্যাক্স, বর্ডার পারমিট এবং পার্কিং খরচ রসিদ অনুযায়ী আলাদা নেওয়া হয়।'
    },
    {
      q: 'Are AC and Non-AC both options available for all vehicles?',
      qBn: 'সব গাড়িতেই কি এসি ও নন-এসি বিকল্প পাওয়া যায়?',
      a: 'Yes, we have 4, 7, and 9 seater vehicles available with both AC and Non-AC configurations to match your budget and seasonal requirements.',
      aBn: 'হ্যাঁ, আমাদের কাছে ৪, ৭ এবং ৯ সিটের গাড়ি এসি ও নন-এসি উভয় সুবিধাতেই রয়েছে আপনার বাজেট অনুযায়ী।'
    },
    {
      q: 'Do you provide decorated cars for weddings (Biyebari)?',
      qBn: 'বিয়েবাড়ির জন্য ফুল দিয়ে সাজানো বরের গাড়ি কি পাওয়া যায়?',
      a: 'Yes! We specialize in wedding car decorations (especially Toyota Rumion White and Swift Dzire) with fresh flowers and ribbons, along with multi-car convoys for wedding guests.',
      aBn: 'হ্যাঁ! আমাদের টয়োটা রুমিয়ন সাদা এবং সুইফট ডিজায়ার গাড়িতে চমৎকার তাজা ফুল দিয়ে সাজানোর সুব্যবস্থা রয়েছে।'
    }
  ];

  return (
    <section id="contact" className="py-16 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
      {/* Background colorful ambient orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Contact & Office Details */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-sky-300 text-xs font-extrabold uppercase tracking-wider mb-2 border border-sky-500/30">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{isBn ? 'যোগাযোগ ও বুকিং সেন্টার' : 'Contact & Booking Center'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isBn ? 'চলো যাই ট্যুর এন্ড ট্রাভেলস্ - জামালপুর' : 'Cholo Jai Tour & Travels'}
              </h2>
              <p className="text-sm text-indigo-200 font-bengali font-semibold mt-1">
                {isBn ? BUSINESS_INFO.nameBn : 'Professional Car Rental Agency in Purba Bardhaman'}
              </p>
            </div>

            {/* Address Card */}
            <div className="bg-slate-900/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-indigo-500/20 shadow-xl space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-300">{isBn ? 'মূল ঠিকানা' : 'Office Address'}</h4>
                    <a
                      href={BUSINESS_INFO.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:text-sky-300 hover:underline font-bold flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isBn ? 'গুগল ম্যাপে দেখুন' : 'Google Maps'}</span>
                    </a>
                  </div>
                  <a
                    href={BUSINESS_INFO.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <p className="text-sm text-amber-300 font-bengali font-bold mt-0.5 group-hover:text-amber-200 transition-colors">
                      {BUSINESS_INFO.addressBn}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors">
                      {BUSINESS_INFO.address}
                    </p>
                  </a>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex items-start gap-3.5 pt-4 border-t border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">{isBn ? 'ফোন ও হোয়াটসঅ্যাপ' : '24x7 Hotlines'}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <a href={`tel:${BUSINESS_INFO.phone1}`} className="text-lg font-black text-sky-400 hover:text-sky-300 hover:underline">
                      +91 {BUSINESS_INFO.phone1}
                    </a>
                    <a href={`tel:${BUSINESS_INFO.phone2}`} className="text-lg font-black text-sky-400 hover:text-sky-300 hover:underline">
                      +91 {BUSINESS_INFO.phone2}
                    </a>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    ✓ WhatsApp Available on 9153302517
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="flex items-start gap-3.5 pt-4 border-t border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-300">{isBn ? 'পেমেন্ট মাধ্যম (UPI / PhonePe)' : 'Payment Methods'}</h4>
                  <p className="text-xs text-slate-300">
                    PhonePe / Google Pay / Paytm / Cash: <strong className="text-amber-300 font-black">9153302517</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <a
                href={`tel:${BUSINESS_INFO.phone1}`}
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>{isBn ? 'কল করুন' : 'Call 9153302517'}</span>
              </a>

              <a
                href={`https://wa.me/91${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent('Hello Cholo Jai Tour & Travels! I want to make a car booking inquiry.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp Chat'}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Google Maps Location Simulation & FAQs */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Map Card */}
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span>Google Maps • Jamalpur, Purba Bardhaman (PIN 713408)</span>
                </div>
                <a 
                  href={BUSINESS_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-bold hover:underline"
                >
                  {isBn ? 'ম্যাপে ওপেন করুন ↗' : 'Open in Maps ↗'}
                </a>
              </div>

              {/* Styled Interactive Map Box */}
              <a
                href={BUSINESS_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-44 rounded-xl bg-slate-900 border border-slate-700 relative overflow-hidden flex flex-col items-center justify-center p-4 text-center group hover:border-sky-500/50 transition-all cursor-pointer block"
              >
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px] group-hover:opacity-40 transition-opacity"></div>
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                    Cholo Jai Tour & Travels (কালেড়াঘাট, জামালপুর)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Purba Bardhaman, West Bengal 713408
                  </p>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-600/30 text-sky-300 border border-blue-400/30 text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {isBn ? '📍 লাইভ গুগল ম্যাপ লোকেশন ও নেভিগেশন' : '📍 Live Google Maps Location & Directions'}
                  </span>
                </div>
              </a>
            </div>

            {/* FAQs Accordion */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5">
              <h3 className="text-base font-bold text-white mb-4">
                {isBn ? 'সাধারণ প্রশ্ন ও উত্তর (FAQs)' : 'Frequently Asked Questions'}
              </h3>
              <div className="space-y-2.5">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div 
                      key={idx}
                      className="rounded-xl bg-slate-900/60 border border-slate-700/80 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white"
                      >
                        <span>{isBn ? faq.qBn : faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-sky-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
                          {isBn ? faq.aBn : faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} Cholo Jai Tour & Travels (চলো যাই ট্যুর এন্ড ট্রাভেলস্). All rights reserved.</p>
          <p>Kaleraghat, Jamalpur, Purba Bardhaman, PIN - 713408 | 24x7 Booking: 9153302517 / 6296267402</p>
        </div>

      </div>
    </section>
  );
};
