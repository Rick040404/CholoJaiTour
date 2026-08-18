import React from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquare, ShieldCheck, Award } from 'lucide-react';
import { GOOGLE_REVIEWS, BUSINESS_INFO } from '../data/fleetData';
import { Language } from '../types';

interface ReviewsSectionProps {
  lang: Language;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ lang }) => {
  const isBn = lang === 'bn';

  return (
    <section id="reviews" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Google Score Overview Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-amber-300 leading-none">4.9</span>
              <div className="flex text-amber-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-current" />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white">
                  {isBn ? 'গুগল গ্রাহক সন্তুষ্টি স্কোর' : 'Google Customer Reviews'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-extrabold shadow-xs">
                  {BUSINESS_INFO.totalReviews}+ {isBn ? 'রিভিউ' : 'Ratings'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 font-medium">
                {isBn 
                  ? 'জামালপুর, বর্ধমান ও পশ্চিমবঙ্গের নির্ভরযোগ্য গাড়ি ভাড়া সংস্থা।'
                  : 'Based on genuine traveler experiences across West Bengal & All-India trips.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-blue-100 relative z-10">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? '১০০% ভেরিফায়েড চালক' : '100% Verified Drivers'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{isBn ? 'শীর্ষ মানের পরিষেবা' : 'Top Rated Service'}</span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GOOGLE_REVIEWS.map((rev, idx) => {
            const avatarColors = [
              'from-blue-500 to-indigo-600',
              'from-amber-500 to-orange-600',
              'from-emerald-500 to-teal-600',
              'from-purple-500 to-pink-600'
            ];
            const avatarGradient = avatarColors[idx % avatarColors.length];

            return (
              <div 
                key={rev.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Author row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${avatarGradient} text-white font-black text-sm flex items-center justify-center shadow-sm`}>
                        {rev.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                          {rev.author}
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">{rev.location} • {rev.date}</span>
                      </div>
                    </div>

                    <div className="flex text-amber-400">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current drop-shadow-xs" />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4 font-medium">
                    "{isBn ? rev.commentBn : rev.comment}"
                  </p>
                </div>

                {/* Tag for Car & Trip */}
                <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-100 text-slate-500">
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    🚗 {rev.carUsed}
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    📍 {rev.tripType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
