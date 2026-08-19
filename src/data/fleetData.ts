import { FleetCar } from '../types';
import ertigaImg from '../assets/images/ertiga_white_car_1786988647876.jpg';
import rumionWhiteImg from '../assets/images/rumion_white_1786987545999.jpg';
import rumionSilverImg from '../assets/images/rumion_silver_1786987565777.jpg';
import scorpioImg from '../assets/images/scorpio_white_car_1786988667728.jpg';
import wagonRImg from '../assets/images/wagon_r_1786987598281.jpg';
import swiftDzireImg from '../assets/images/swift_dzire_1786987618202.jpg';

export const BUSINESS_INFO = {
  name: 'Cholo Jai Tour & Travels',
  nameBn: 'চলো যাই ট্যুর এন্ড ট্রাভেলস্',
  tagline: 'ভারতের যে কোন জায়গায় ভ্রমন বা অনুষ্ঠানের জন্য গাড়ি ভাড়া',
  taglineEn: 'Car rental service for All-India tours, family trips, weddings & events',
  phone1: '9153302517',
  phone2: '6296267402',
  whatsapp: '9153302517',
  upiId: '9153302517@ybl',
  address: 'Kaleraghat, Jamalpur, Purba Bardhaman, West Bengal - 713408',
  addressBn: 'কালেড়াঘাট, জামালপুর, পূর্ব বর্ধমান, পিন- ৭১৩৪০৮',
  googleMapsUrl: 'https://maps.app.goo.gl/sfNgNGXcFYcmBjR48',
  googleRating: 4.9,
  totalReviews: 148,
  establishedYear: '2020',
  operatingHours: '24 Hours Open (24x7)',
  operatingHoursBn: '২৪ ঘন্টা খোলা (২৪x৭)',
};

export const FLEET_CARS: FleetCar[] = [
  {
    id: 'ertiga',
    name: 'Maruti Suzuki Ertiga',
    nameBn: 'মারুতি সুজুকি এরটিগা (Ertiga)',
    category: 'MUV',
    seats: '7 Seater (6+1)',
    seatsBn: '৭ সিটের (৬+১)',
    color: 'Pearl Arctic White',
    colorBn: 'পার্ল হোয়াইট (সাদা)',
    acType: 'Dual Zone AC / Non-AC',
    acTypeBn: 'ডুয়াল জোন এসি / নন-এসি',
    image: ertigaImg,
    luggage: '3 Large Bags + Roof Carrier',
    fuelType: 'Petrol / Hybrid',
    ratePerKm: 14,
    baseDailyRate: 2800,
    highlightTag: 'Most Popular for Family',
    highlightTagBn: 'পারিবারিক ভ্রমণের সেরা পছন্দ',
    description: 'High-comfort 7-seater MUV with roof luggage carrier, smooth suspension, and roof AC vents for all rows. Best suited for family holiday tours across India.',
    descriptionBn: 'পারিবারিক ভ্রমণের জন্য আরামদায়ক ৭ সিটের প্রিমিয়াম গাড়ি। রুফ ক্যারিয়ার এবং প্রতিটি সারির জন্য আলাদা এসি ভেন্ট সহ অত্যন্ত আরামদায়ক সফর।',
    features: [
      'Roof AC vents in all rows',
      'Spacious legroom & recline seats',
      'Luggage carrier installed',
      'Bluetooth audio system',
      'Mobile charging points',
      'Commercial permit & insurance'
    ],
    featuresBn: [
      'প্রতিটি সিটে আলাদা এসি ভেন্ট',
      'আরামদায়ক লেগরুম ও রিক্লাইন সিট',
      'রুফ লাগেজ ক্যারিয়ার সুবিধা',
      'ব্লুটুথ মিউজিক সিস্টেম',
      'মোবাইল ফাস্ট চার্জিং পয়েন্ট',
      'অল ইন্ডিয়া কমার্শিয়াল পারমিট'
    ],
    idealFor: ['All India Family Tours', 'Digha / Mandarmani Trips', 'Wedding Guest Transport', 'Airport Transfers'],
    idealForBn: ['অল ইন্ডিয়া ফ্যামিলি ট্যুর', 'দিঘা / মন্দারমণি ট্যুর', 'বিয়ের অতিথি যাতায়াত', 'এয়ারপোর্ট ড্রপ']
  },
  {
    id: 'rumion-white',
    name: 'Toyota Rumion (Pearl White)',
    nameBn: 'টয়োটা রুমিয়ন - সাদা (Rumion White)',
    category: 'MUV',
    seats: '7 Seater (6+1)',
    seatsBn: '৭ সিটের (৬+১)',
    color: 'Pearl Crystal White',
    colorBn: 'পার্ল ক্রিস্টাল হোয়াইট (সাদা)',
    acType: 'Full Climate Control AC',
    acTypeBn: 'ফুল ক্লাইমেট কন্ট্রোল এসি',
    image: rumionWhiteImg,
    luggage: '3-4 Medium Bags',
    fuelType: 'Petrol / Efficient Hybrid',
    ratePerKm: 15,
    baseDailyRate: 3000,
    highlightTag: 'VIP & Wedding Special',
    highlightTagBn: 'বিবাহ ও ভিআইপি বিশেষ',
    description: 'Luxurious Toyota Rumion in sparkling Pearl White. Premium interior finish, supreme ride quality and chrome accents make it perfect for weddings and VIP travel.',
    descriptionBn: 'ঝকঝকে সাদা রঙের রাজকীয় টয়োটা রুমিয়ন। বিবাহ অনুষ্ঠান, ভিআইপি যাতায়াত এবং দূরপাল্লার আরামদায়ক ভ্রমণের জন্য উপযুক্ত।',
    features: [
      'Toyota premium comfort seats',
      'Touchscreen infotainment',
      'Cushioned suspension for highways',
      'Dual airbags & ABS safety',
      'Decorated bridal car option available',
      'Uniformed professional chauffeur'
    ],
    featuresBn: [
      'টয়োটা প্রিমিয়াম আরামদায়ক সিটিং',
      'টাচস্ক্রিন ইনফোটেইনমেন্ট',
      'হাইওয়ের জন্য স্মুথ সাসপেনশন',
      'ডুয়াল এয়ারব্যাগ ও এবিএস সুরক্ষা',
      'বরের গাড়ি স্পেশাল সাজানোর ব্যবস্থা',
      'অভিজ্ঞ ও ভদ্র চালক'
    ],
    idealFor: ['Groom / Bridal Wedding Car', 'Corporate VIP Tours', 'Kolkata Airport Drop', 'Long Highway Journeys'],
    idealForBn: ['বিবাহের বরের গাড়ি', 'ভিআইপি ও কর্পোরেট সফর', 'কলকাতা এয়ারপোর্ট ড্রপ', 'দূরপাল্লার হাইওয়ে ট্রিপ']
  },
  {
    id: 'rumion-silver',
    name: 'Toyota Rumion (Metallic Silver)',
    nameBn: 'টয়োটা রুমিয়ন - সিলভার (Rumion Silver)',
    category: 'MUV',
    seats: '7 Seater (6+1)',
    seatsBn: '৭ সিটের (৬+১)',
    color: 'Metallic Silver',
    colorBn: 'মেটালিক সিলভার',
    acType: 'Chilled Dual AC',
    acTypeBn: 'চিলড ডুয়াল এসি',
    image: rumionSilverImg,
    luggage: '3-4 Bags + Flexible fold',
    fuelType: 'Petrol / Smart Hybrid',
    ratePerKm: 15,
    baseDailyRate: 3000,
    highlightTag: 'Highway Long Drive Special',
    highlightTagBn: 'দূরপাল্লার লং ড্রাইভ স্পেশাল',
    description: 'Sleek Metallic Silver Toyota Rumion 7-seater engineered for seamless outstation tours across West Bengal, Odisha, Bihar, Jharkhand & North East.',
    descriptionBn: 'মেটালিক সিলভার রঙের শক্তিশালী টয়োটা রুমিয়ন। দার্জিলিং, পুরুলিয়া, মায়াপুর বা অল ইন্ডিয়া ট্যুরের জন্য অনবদ্য পছন্দ।',
    features: [
      'High-speed stability on expressways',
      'Powerful multi-vent cooling AC',
      'Deep cushioned seating',
      'Large boot capacity with split seats',
      'Clean & sanitized before every trip',
      '24x7 Roadside assistance'
    ],
    featuresBn: [
      'এক্সপ্রেসওয়েতে চমৎকার স্টেবিলিটি',
      'দ্রুত ঠাণ্ডা করার ডুয়াল এসি',
      'আরামদায়ক কুশন সিট',
      'ভাঁজ করা সিটে অতিরিক্ত লাগেজ স্পেস',
      'প্রতিটি ট্রিপের আগে স্যানিটাইজড',
      '২৪x৭ রোডসাইড সহায়তা'
    ],
    idealFor: ['Puri / Darjeeling Tours', 'Temple Pilgrimages (Mayapur/Tarapith)', 'Outstation Family Vacations', 'Business Group Trips'],
    idealForBn: ['পুরী / দার্জিলিং ভ্রমণ', 'তীর্থযাত্রা (মায়াপুর/তারাপীঠ)', 'আউটস্টেশন ফ্যামিলি ভ্যাকেশন', 'অফিসিয়াল গ্রুপ ট্যুর']
  },
  {
    id: 'scorpio-classic',
    name: 'Mahindra Scorpio Classic',
    nameBn: 'মহিন্দ্রা স্করপিও ক্লাসিক (Scorpio Classic)',
    category: 'SUV',
    seats: '9 Seater (8+1)',
    seatsBn: '৯ সিটের (৮+১)',
    color: 'Diamond Arctic White',
    colorBn: 'ডায়মন্ড হোয়াইট (সাদা)',
    acType: 'High-Power AC / Non-AC',
    acTypeBn: 'হাই-পাওয়ার এসি / নন-এসি',
    image: scorpioImg,
    luggage: 'Heavy Luggage Capacity',
    fuelType: 'mHawk Diesel Power',
    ratePerKm: 17,
    baseDailyRate: 3500,
    highlightTag: '9 Seater SUV & Hill Specialist',
    highlightTagBn: '৯ সিটের পাওয়ারফুল এসইউভি',
    description: 'The legendary rugged 9-seater SUV with powerful mHawk diesel engine. High ground clearance and spacious 9-passenger seating make it ideal for large groups, hills & rough terrains.',
    descriptionBn: 'কিংবদন্তি শক্তিশালী ৯ সিটের স্করপিও ক্লাসিক। উঁচু গ্রাউন্ড ক্লিয়ারেন্স এবং ডিজেল পাওয়ারের কারণে বড় দলের সফর, পাহাড়, জঙ্গল এবং যেকোনো রাস্তায় আরামদায়ক যাত্রা।',
    features: [
      'Spacious 9-seater passenger seating (8+1)',
      'Muscular mHawk diesel engine',
      'High ground clearance for hill roads',
      'Heavy duty suspension for smooth ride',
      'Extra boot & top luggage carrier',
      'High-power AC & Fog lamps for mountain driving'
    ],
    featuresBn: [
      'প্রশস্ত ৯ সিটের আসন ব্যবস্থা (৮+১)',
      'শক্তিশালী mHawk ডিজেল ইঞ্জিন',
      'পাহাড়ি রাস্তার জন্য উঁচু গ্রাউন্ড ক্লিয়ারেন্স',
      'হেভি ডিউটি সাসপেনশন',
      'রুফ লাগেজ ক্যারিয়ার',
      'হাই-পাওয়ার এসি ও নিরাপদ ফগ ল্যাম্প'
    ],
    idealFor: ['Large Group & Family Tours (9 Seater)', 'Darjeeling & Sikkim Hills', 'Purulia Ayodhya Hills', 'Baraat / Wedding Convoys'],
    idealForBn: ['বড় দল ও পরিবারের ভ্রমণ (৯ সিট)', 'দার্জিলিং ও সিকিম পাহাড়', 'পুরুলিয়া অযোধ্যা পাহাড়', 'বিয়ের বরযাত্রী কনভয়']
  },
  {
    id: 'wagnor',
    name: 'Maruti Suzuki WagonR',
    nameBn: 'মারুতি সুজুকি ওয়াগন-আর (WagonR)',
    category: 'Hatchback',
    seats: '4+1 Seater',
    seatsBn: '৪+১ সিটের',
    color: 'Fire Red / Silky Silver',
    colorBn: 'ফায়ার রেড / সিল্কি সিলভার',
    acType: 'Chilled Chiller AC / Non-AC',
    acTypeBn: 'চিলড এসি / নন-এসি',
    image: wagonRImg,
    luggage: '2 Medium Bags',
    fuelType: 'Petrol',
    ratePerKm: 11,
    baseDailyRate: 1800,
    highlightTag: 'Budget Friendly & City Fast',
    highlightTagBn: 'সাশ্রয়ী ভাড়া ও দ্রুত সার্ভিস',
    description: 'Tall-boy spacious hatchback that is extremely economical and agile. Ideal for quick city runs, medical emergency visits to Burdwan/Kolkata, and budget family trips.',
    descriptionBn: 'উঁচু ছাদের খোলামেলা ও সাশ্রয়ী ওয়াগন-আর। বর্ধমান বা কলকাতার ডাক্তারখানা/হাসপাতাল যাতায়াত এবং অল্প খরচে ভ্রমণের জন্য সেরা।',
    features: [
      'Tall-boy design with easy entry/exit',
      'High mileage low-cost pricing',
      'Compact size for narrow village & city roads',
      'Strong AC cooling',
      'Great for elders and patient transport',
      'Quick instant dispatch'
    ],
    featuresBn: [
      'টপ-বয় ডিজাইন - সহজে ওঠা-নামার সুবিধা',
      'কম খরচে সাশ্রয়ী কিলোমিটার রেট',
      'গ্রাম ও শহরের সরু রাস্তায় দ্রুত চলাচল',
      'চমৎকার এসি কুলিং',
      'ডাক্তারখানা ও রোগী যাতায়াতে সুবিধাজনক',
      'তাত্ক্ষণিক বুকিং ও গাড়ি পাওয়া যায়'
    ],
    idealFor: ['Burdwan & Kolkata Hospital Visits', 'Budget Family Trips', 'Local Jamalpur & Memari Trips', 'Short Outstation Dropping'],
    idealForBn: ['বর্ধমান ও কলকাতা ডাক্তারখানা যাতায়াত', 'বাজেট ফ্যামিলি ট্যুর', 'জামালপুর ও মেমারি লোকাল ট্রিপ', 'শর্ট আউটস্টেশন ড্রপ']
  },
  {
    id: 'swift-dzire',
    name: 'Maruti Suzuki Swift Dzire',
    nameBn: 'মারুতি সুজুকি সুইফট ডিজায়ার (Swift Dzire)',
    category: 'Sedan',
    seats: '4+1 Seater',
    seatsBn: '৪+১ সিটের',
    color: 'Arctic White',
    colorBn: 'আর্কটিক হোয়াইট (সাদা)',
    acType: 'Automatic AC / Climate Control',
    acTypeBn: 'অটোমেটিক এসি / ক্লাইমেট কন্ট্রোল',
    image: swiftDzireImg,
    luggage: 'Dedicated 378L Sedan Boot Space',
    fuelType: 'Petrol Smooth',
    ratePerKm: 12,
    baseDailyRate: 2200,
    highlightTag: 'Executive Comfort & Sedan Style',
    highlightTagBn: 'আরামদায়ক সেডান ও এয়ারপোর্ট স্পেশাল',
    description: 'Premium compact sedan offering sedan comfort, smooth ride, generous boot space, and executive elegance. Perfect for Kolkata airport drop and official travel.',
    descriptionBn: 'মার্জিত লুকের সাদা সুইফট ডিজায়ার সেডান। কলকাতা বিমানবন্দর ড্রপ, অফিসিয়াল কাজ ও আরামদায়ক ব্যক্তিগত ভ্রমণের জন্য আদর্শ।',
    features: [
      'Dedicated 378 Liters boot trunk',
      'Rear AC vents for passenger comfort',
      'Plush sedan seats with armrest',
      'Smooth soundproof cabin',
      'Experienced highway driver',
      'Toll & fastag enabled'
    ],
    featuresBn: [
      'বিশাল ৩৭৮ লিটার বুট স্পেস',
      'পেছনের সিটের জন্য আলাদা এসি ভেন্ট',
      'আরামদায়ক আর্মরেস্ট সহ সিট',
      'শান্ত ও সাউন্ডপ্রুফ কেবিন',
      'অভিজ্ঞ হাইওয়ে ড্রাইভার',
      'ফাস্ট্যাগ সুবিধাযুক্ত'
    ],
    idealFor: ['Kolkata CCU Airport Drops', 'Business & Official Travel', 'Howrah / Sealdah Railway Pickups', 'Weekend Getaways'],
    idealForBn: ['কলকাতা বিমানবন্দর ড্রপ', 'অফিসিয়াল ও বিজনেস ট্রিপ', 'হাওড়া / শিয়ালদহ স্টেশন পিকআপ', 'উইকেন্ড ভ্রমণ']
  }
];

export const POPULAR_ROUTES = [
  {
    from: 'Jamalpur / Kaleraghat',
    fromBn: 'জামালপুর / কালেড়াঘাট',
    to: 'Kolkata Airport (CCU)',
    toBn: 'কলকাতা বিমানবন্দর',
    distanceKm: 85,
    duration: '2.0 - 2.5 hrs',
    durationBn: '২.০ - ২.৫ ঘন্টা',
    popularCar: 'Swift Dzire / Rumion',
    basePrice: 2200
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Digha / Mandarmani Beach',
    toBn: 'দিঘা / মন্দারমণি সমুদ্র সৈকত',
    distanceKm: 210,
    duration: '4.5 - 5.0 hrs',
    durationBn: '৪.৫ - ৫.০ ঘন্টা',
    popularCar: 'Ertiga / Rumion',
    basePrice: 4800
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Mayapur ISKCON Temple',
    toBn: 'মায়াপুর ইসকন মন্দির',
    distanceKm: 95,
    duration: '2.5 hrs',
    durationBn: '২.৫ ঘন্টা',
    popularCar: 'Rumion / Ertiga',
    basePrice: 2500
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Tarapith / Bakreshwar',
    toBn: 'তারাপীঠ / বক্রেশ্বর',
    distanceKm: 135,
    duration: '3.0 - 3.5 hrs',
    durationBn: '৩.০ - ৩.৫ ঘন্টা',
    popularCar: 'Scorpio Classic / Ertiga',
    basePrice: 3200
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Darjeeling / Kalimpong (Hills)',
    toBn: 'দার্জিলিং / কালিম্পং (পাহাড়)',
    distanceKm: 560,
    duration: '12 - 14 hrs (Multi-day)',
    durationBn: '১২ - ১৪ ঘন্টা (বহুদিনের ট্যুর)',
    popularCar: 'Scorpio Classic / Rumion',
    basePrice: 16500
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Puri Dham (Jagannath Temple)',
    toBn: 'পুরী ধাম (জগন্নাথ মন্দির)',
    distanceKm: 520,
    duration: '10 - 11 hrs',
    durationBn: '১০ - ১১ ঘন্টা',
    popularCar: 'Rumion White / Ertiga',
    basePrice: 14000
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Purulia (Ayodhya Pahar)',
    toBn: 'পুরুলিয়া (অযোধ্যা পাহাড়)',
    distanceKm: 230,
    duration: '5.0 hrs',
    durationBn: '৫.০ ঘন্টা',
    popularCar: 'Scorpio Classic / Ertiga',
    basePrice: 5200
  },
  {
    from: 'Jamalpur / Bardhaman',
    fromBn: 'জামালপুর / বর্ধমান',
    to: 'Burdwan Medical / Kolkata Hospital',
    toBn: 'বর্ধমান / কলকাতা হাসপাতাল যাতায়াত',
    distanceKm: 40,
    duration: '1.0 hr (Quick 24x7)',
    durationBn: '১.০ ঘন্টা (জরুরী ২৪x৭)',
    popularCar: 'WagonR / Swift Dzire',
    basePrice: 1200
  }
];

export const GOOGLE_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Subrata Banerjee',
    location: 'Burdwan, WB',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Booked the Toyota Rumion White for our family trip to Mandarmani and Digha. The car was spotless, AC was super chill, and the driver arrived 15 mins before time. Highly recommended!',
    commentBn: 'আমাদের মন্দারমণি ও দিঘা ফ্যামিলি ট্রিপের জন্য টয়োটা রুমিয়ন সাদা বুক করেছিলাম। গাড়ি খুব পরিষ্কার ছিল, এসি খুব ভালো এবং ড্রাইভার নির্দিষ্ট সময়ের আগেই পৌঁছেছিলেন। খুব ভালো সার্ভিস!',
    tripType: 'Family Vacation',
    carUsed: 'Toyota Rumion (White)',
    verified: true
  },
  {
    id: 'rev-2',
    author: 'Amitava Ghosh',
    location: 'Jamalpur',
    rating: 5,
    date: '1 month ago',
    comment: 'Scorpio Classic was the best decision for our North Bengal Darjeeling tour. Handled the steep hill climbs effortlessly with 7 passengers and luggage. Very honest and polite drivers from Cholo Jai!',
    commentBn: 'দার্জিলিং ট্যুরের জন্য স্করপিও ক্লাসিক নেওয়া সেরা সিদ্ধান্ত ছিল। ৭ জন যাত্রী ও মালপত্র নিয়ে পাহাড়ি রাস্তায় খুব সহজে চলল। চলো যাই ট্রাভেলসের ড্রাইভার অত্যন্ত ভালো ও দক্ষ।',
    tripType: 'Hill Station Tour',
    carUsed: 'Mahindra Scorpio Classic',
    verified: true
  },
  {
    id: 'rev-3',
    author: 'Riya Mukherjee',
    location: 'Memari, Purba Bardhaman',
    rating: 5,
    date: '3 weeks ago',
    comment: 'Hired the Maruti Swift Dzire for late night Kolkata Airport pickup. Prompt communication on WhatsApp and very reasonable rate. Will definitely book again.',
    commentBn: 'রাতের বেলা কলকাতা এয়ারপোর্ট পিকআপের জন্য সুইফট ডিজায়ার নিয়েছিলাম। হোয়াটসঅ্যাপে দ্রুত রেসপন্স ও একদম সঠিক ভাড়া। ভবিষ্যতে আবার নেব।',
    tripType: 'Airport Transfer',
    carUsed: 'Maruti Swift Dzire',
    verified: true
  },
  {
    id: 'rev-4',
    author: 'Prakash Dutta',
    location: 'Kaleraghat',
    rating: 5,
    date: '2 months ago',
    comment: 'We booked 3 cars (Rumion White, Ertiga and Scorpio) for my brother wedding ceremony. All cars were decorated beautifully and arrived in convoy. Great service in Jamalpur area.',
    commentBn: 'ভাইয়ের বিয়ের জন্য ৩টি গাড়ি (রুমিয়ন, এরটিগা ও স্করপিও) নিয়েছিলাম। গাড়িগুলো সুন্দর সাজানো হয়েছিল এবং সময়মতো হাজির হয়েছিল। জামালপুর এলাকার সেরা ট্রাভেলস।',
    tripType: 'Wedding Ceremony Fleet',
    carUsed: 'Fleet Combo (3 Cars)',
    verified: true
  }
];
