/**
 * Bengali Voice Recognition & Smart Dispatch Parser
 * Uses Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * with bn-IN (Bengali India) / en-IN locale, microphone permission handling,
 * mobile device detection, and universal semantic entity extraction for Local Trips & Driver Dispatch.
 */

import { DriverProfile, FleetCar } from '../types';

export interface VoiceParsedResult {
  rawTranscript: string;
  matchedDriver?: DriverProfile;
  driverName?: string;
  driverPhone?: string;
  matchedCarId?: string;
  pickup?: string;
  destination?: string;
  customerName?: string;
  customerPhone?: string;
  dateStr?: string;
  timeSlot?: string;
  tripType?: string;
  notes?: string;
  confidence: number;
}

// Bengali digit map for individual characters
const BENGALI_DIGIT_CHARS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

// Spoken Bengali digit words
const BENGALI_WORD_DIGITS: [RegExp, string][] = [
  [/শূন্য/g, '0'],
  [/এক/g, '1'],
  [/দুই|দুটো/g, '2'],
  [/তিন|তিনটে/g, '3'],
  [/চার|চারটে/g, '4'],
  [/পাঁচ|পাঁচটা/g, '5'],
  [/ছয়|ছয়|ছটা/g, '6'],
  [/সাত|সাতটা/g, '7'],
  [/আট|আটটা/g, '8'],
  [/নয়|নয়|নটা/g, '9'],
  [/zero/gi, '0'],
  [/one/gi, '1'],
  [/two/gi, '2'],
  [/three/gi, '3'],
  [/four/gi, '4'],
  [/five/gi, '5'],
  [/six/gi, '6'],
  [/seven/gi, '7'],
  [/eight/gi, '8'],
  [/nine/gi, '9']
];

// Common Bengali local destinations around Jamalpur / Purba Bardhaman
export const POPULAR_LOCAL_DESTINATIONS = [
  { nameBn: 'বর্ধমান স্টেশন / টাউন', nameEn: 'Burdwan Station / Town' },
  { nameBn: 'বর্ধমান মেডিকেল কলেজ (অনাময়)', nameEn: 'Burdwan Medical / Anamoy' },
  { nameBn: 'মেমারি বাজার ও স্টেশন', nameEn: 'Memari Bazaar & Station' },
  { nameBn: 'শক্তিগড় ল্যাংচা হাব', nameEn: 'Shaktigarh Langcha Hub' },
  { nameBn: 'নবাবহাট বাস টার্মিনাস', nameEn: 'Nababhat Bus Stand' },
  { nameBn: 'কালনা ১০৮ শিবমন্দির', nameEn: 'Kalna 108 Shiva Temple' },
  { nameBn: 'গুসকরা / ভাতার', nameEn: 'Guskara / Bhatar' },
  { nameBn: 'তারাপীঠ মন্দির', nameEn: 'Tarapith Temple' },
  { nameBn: 'মায়াপুর ইসকন মন্দির', nameEn: 'Mayapur ISKCON Temple' },
  { nameBn: 'কলকাতা বিমানবন্দর (CCU)', nameEn: 'Kolkata Airport (CCU)' },
  { nameBn: 'হাওড়া / শিয়ালদহ স্টেশন', nameEn: 'Howrah / Sealdah Station' },
  { nameBn: 'দিঘা সমুদ্র সৈকত', nameEn: 'Digha Sea Beach' },
  { nameBn: 'লোকাল বিবাহ বাড়ি / অনুষ্ঠান', nameEn: 'Local Wedding / Event' },
  { nameBn: 'জামালপুর লোকাল রাউন্ড ট্রিপ', nameEn: 'Jamalpur Local Round Trip' },
];

// Quick voice sample templates for instant 1-tap testing & dictation (no fare)
export const QUICK_VOICE_TEMPLATES = [
  {
    label: 'জামালপুর ➔ বর্ধমান স্টেশন (বিকাশ ঘোষ, সকাল ৭টা)',
    phrase: 'জামালপুর থেকে বর্ধমান স্টেশন যাব সকাল ৭ টায়, যাত্রী বিকাশ ঘোষ ফোন ৯১৫৩৩০২৫১৭, ড্রাইভার রাহুল'
  },
  {
    label: 'জামালপুর ➔ মেমারি বাজার (অমল বাবু, সকাল ৯টা)',
    phrase: 'জামালপুর বাজার থেকে মেমারি স্টেশন যাব সকাল ৯ টায়, যাত্রী অমল বাবু ফোন ৯৮৭৬৫৪৩২১০'
  },
  {
    label: 'জামালপুর ➔ কলকাতা এয়ারপোর্ট (সুবীর সেন, ভোর ৫টা)',
    phrase: 'জামালপুর থেকে কলকাতা বিমানবন্দর যাব ভোর ৫ টায়, যাত্রী সুবীর সেন ফোন ৯৮৩০০১২৩৪৫, ড্রাইভার তাপস'
  },
  {
    label: 'জামালপুর ➔ তারাপীঠ মন্দির (শুভঙ্কর নন্দী, সকাল ৬টা)',
    phrase: 'জামালপুর থেকে তারাপীঠ যাব সকাল ৬ টায়, যাত্রী শুভঙ্কর নন্দী ফোন ৯৪৫১১২২৩৩৪, ড্রাইভার বাবান'
  },
  {
    label: 'জামালপুর লোকাল বিবাহ বাড়ি ট্রিপ (রাজেশ দত্ত, বিকেল ৪টা)',
    phrase: 'জামালপুর থেকে লোকাল বিবাহ বাড়ি যাব বিকেল ৪ টায়, কাস্টমার রাজেশ দত্ত ফোন ৯৯৩৩৪৪৫৫৬৬'
  }
];

/**
 * Check if Web Speech API is supported in current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Detect if current device is a mobile or tablet
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

/**
 * Request explicit microphone permission on mobile/desktop browsers
 * Prompts native mobile permission sheet cleanly.
 */
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { granted: true };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (err: any) {
    console.warn('Microphone permission request error:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return { 
        granted: false, 
        error: 'মাইক্রোফোন পারমিশন বন্ধ আছে। মোবাইলের ব্রাউজার সেটিংসে গিয়ে Microphone Allow করুন অথবা নিচে কীবোর্ডের মাইক দিয়ে মুখে বলুন।' 
      };
    }
    return { granted: false, error: err.message || 'Microphone access failed' };
  }
}

/**
 * Convert all Bengali numerals (০-৯) to English digits (0-9)
 */
export function convertBengaliDigitsToAscii(text: string): string {
  if (!text) return '';
  return text.replace(/[০-৯]/g, (char) => BENGALI_DIGIT_CHARS[char] || char);
}

/**
 * Convert spoken Bengali words & digits to standard numeric digits
 */
export function convertAllBengaliNumbersToDigits(text: string): string {
  if (!text) return '';
  let result = convertBengaliDigitsToAscii(text);

  // Word digits
  for (const [regex, digit] of BENGALI_WORD_DIGITS) {
    result = result.replace(regex, digit);
  }

  return result;
}

/**
 * Clean & normalize string for fuzzy matching
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return convertBengaliDigitsToAscii(text)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()|।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract phone digits from Bengali/English speech transcript
 */
export function extractPhoneNumber(transcript: string): string | undefined {
  if (!transcript) return undefined;

  // 1. Direct standard 10-digit number in ascii or bengali script
  const asciiConverted = convertBengaliDigitsToAscii(transcript);
  
  // Look for phone keywords followed by numbers: ফোন / মোবাইল / phone / mobile / number / no
  const phonePattern = /(?:ফোন|মোবাইল|নম্বর|নাম্বার|phone|mobile|call|contact|ph|mob)\s*(?:হলো|হবে|is|:|–|-)?\s*([০-৯0-9\s-]{10,18})/i;
  const matchWithKeyword = asciiConverted.match(phonePattern);
  if (matchWithKeyword && matchWithKeyword[1]) {
    const cleanDigits = matchWithKeyword[1].replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      return cleanDigits.slice(-10);
    }
  }

  // 2. Convert spoken word numbers to digits
  const wordConverted = convertAllBengaliNumbersToDigits(transcript);
  const allDigits = wordConverted.replace(/\D/g, '');

  if (allDigits.length >= 10) {
    // If multiple digits, match 10-digit Indian standard mobile number starting with 6,7,8,9
    const indianMobileMatch = allDigits.match(/[6-9]\d{9}/);
    if (indianMobileMatch) {
      return indianMobileMatch[0];
    }
    return allDigits.slice(-10);
  }

  return undefined;
}

/**
 * Extract date from speech (e.g. "আজকে", "কালকে", "আগামীকাল", "পরশু", "২৫ আগস্ট", "Today", "Tomorrow")
 */
export function extractDateFromSpeech(transcript: string): string | undefined {
  if (!transcript) return undefined;
  const clean = normalizeText(transcript);
  const now = new Date();

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Today
  if (clean.includes('আজ') || clean.includes('আজকে') || clean.includes('today')) {
    return formatDate(now);
  }

  // Tomorrow
  if (clean.includes('কাল') || clean.includes('কালকে') || clean.includes('আগামীকাল') || clean.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  // Day after tomorrow
  if (clean.includes('পরশু') || clean.includes('পরশুদিন') || clean.includes('day after tomorrow')) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDate(dayAfter);
  }

  // Tarshu (+3 days)
  if (clean.includes('তরশু') || clean.includes('তরশুদিন')) {
    const day3 = new Date(now);
    day3.setDate(day3.getDate() + 3);
    return formatDate(day3);
  }

  // Explicit day number: e.g. "২৫ তারিখ", "25th", "২৬ তারিখ"
  const textAscii = convertBengaliDigitsToAscii(transcript);
  const dateMatch = textAscii.match(/(\d{1,2})\s*(?:তারিখ|তারিখে|th|st|nd|rd)/i);
  if (dateMatch && dateMatch[1]) {
    const dayNum = parseInt(dateMatch[1], 10);
    if (dayNum >= 1 && dayNum <= 31) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), dayNum);
      return formatDate(targetDate);
    }
  }

  return undefined;
}

/**
 * Match vehicle / car type from speech (e.g. "স্করপিও", "Scorpio", "WagonR", "Dzire", "Innova", "Eeco", "Ertiga")
 */
export function extractCarFromSpeech(
  transcript: string, 
  cars: FleetCar[] = []
): string | undefined {
  if (!transcript) return undefined;
  const clean = normalizeText(transcript);

  // Check specific car keywords
  if (clean.includes('scorpio') || clean.includes('স্করপিও') || clean.includes('স্করপিয়')) {
    const found = cars.find(c => c.id.includes('scorpio') || c.name.toLowerCase().includes('scorpio'));
    return found?.id || 'scorpio-classic';
  }
  if (clean.includes('wagonr') || clean.includes('wagon r') || clean.includes('ওয়াগন আর') || clean.includes('ওয়াগন')) {
    const found = cars.find(c => c.id.includes('wagonr') || c.name.toLowerCase().includes('wagon'));
    return found?.id || 'wagonr';
  }
  if (clean.includes('dzire') || clean.includes('ডিজায়ার') || clean.includes('ডিজায়ের') || clean.includes('swift')) {
    const found = cars.find(c => c.id.includes('dzire') || c.name.toLowerCase().includes('dzire'));
    return found?.id || 'dzire';
  }
  if (clean.includes('rumion') || clean.includes('রুমিয়ন') || clean.includes('রুময়ন')) {
    const found = cars.find(c => c.id.includes('rumion') || c.name.toLowerCase().includes('rumion'));
    return found?.id || 'rumion-white';
  }
  if (clean.includes('ertiga') || clean.includes('আর্টিগা') || clean.includes('এরটিগা')) {
    const found = cars.find(c => c.id.includes('ertiga') || c.name.toLowerCase().includes('ertiga'));
    return found?.id || 'ertiga';
  }
  if (clean.includes('innova') || clean.includes('ইনোভা')) {
    const found = cars.find(c => c.id.includes('innova') || c.name.toLowerCase().includes('innova'));
    return found?.id || 'innova';
  }
  if (clean.includes('bolero') || clean.includes('বুলেরো') || clean.includes('বোলেরো')) {
    const found = cars.find(c => c.id.includes('bolero') || c.name.toLowerCase().includes('bolero'));
    return found?.id || 'bolero';
  }
  if (clean.includes('eeco') || clean.includes('ইকো')) {
    const found = cars.find(c => c.id.includes('eeco') || c.name.toLowerCase().includes('eeco'));
    return found?.id || 'eeco';
  }

  // 7 Seater / 9 Seater
  if (clean.includes('9 seater') || clean.includes('৯ সিটার') || clean.includes('9 সিটার')) {
    const found = cars.find(c => c.seats.includes('9'));
    return found?.id;
  }
  if (clean.includes('7 seater') || clean.includes('৭ সিটার') || clean.includes('7 সিটার')) {
    const found = cars.find(c => c.seats.includes('7'));
    return found?.id;
  }

  return undefined;
}

/**
 * Match a recognized driver name from speech transcript against driver directory
 */
export function matchDriverFromTranscript(
  transcript: string, 
  drivers: DriverProfile[] = []
): { driver?: DriverProfile; name?: string; confidence: number } {
  if (!transcript) {
    return { confidence: 0 };
  }

  const clean = normalizeText(transcript);

  // 1. Direct or partial name match in registered drivers
  for (const driver of drivers) {
    const dName = normalizeText(driver.name);
    const dPhone = driver.phone.replace(/\D/g, '');

    // Full name in transcript
    if (dName && clean.includes(dName)) {
      return { driver, name: driver.name, confidence: 0.95 };
    }

    // First name match
    const parts = dName.split(' ');
    for (const part of parts) {
      if (part.length >= 3 && clean.includes(part)) {
        return { driver, name: driver.name, confidence: 0.85 };
      }
    }

    // Phone match
    if (dPhone && clean.includes(dPhone)) {
      return { driver, name: driver.name, confidence: 0.9 };
    }
  }

  // 2. Extract potential driver name pattern: "ড্রাইভার [নাম]", "চালক [নাম]", "driver [name]"
  const driverPatternMatch = transcript.match(/(?:ড্রাইভার|চালক|driver)\s*(?:বাবু|দা|হলেন|is|:)?\s*([^\s,।]+(?:\s+[^\s,।]+)?)/i);
  if (driverPatternMatch && driverPatternMatch[1]) {
    let extractedName = driverPatternMatch[1].trim();
    // Exclude noise words
    const exclude = ['ফোন', 'মোবাইল', 'টাকা', 'ভাড়া', 'ভাড়া', 'সকাল', 'আজ', 'কাল', 'গাড়ি', 'গাড়ির', 'যাত্রী'];
    if (!exclude.includes(extractedName.toLowerCase())) {
      // Try to match against driver list
      const subMatch = drivers.find(d => 
        normalizeText(d.name).includes(normalizeText(extractedName)) ||
        normalizeText(extractedName).includes(normalizeText(d.name))
      );
      if (subMatch) {
        return { driver: subMatch, name: subMatch.name, confidence: 0.9 };
      }
      return { name: extractedName, confidence: 0.7 };
    }
  }

  return { confidence: 0 };
}

/**
 * Universal Customer / Passenger Name Extractor from Spoken Transcript
 * Supports ANY arbitrary or novel passenger name in Bengali, English, Hinglish, or mixed speech.
 */
export function extractCustomerNameFromSpeech(
  transcript: string,
  driverName?: string
): string | undefined {
  if (!transcript || !transcript.trim()) return undefined;

  const raw = transcript.trim();

  // Words that should never be recognized as a customer name
  const STOP_WORDS = new Set([
    'জামালপুর', 'বর্ধমান', 'মেমারি', 'কলকাতা', 'শক্তিগড়', 'কালনা', 'তারাপীঠ', 'মায়াপুর', 'দিঘা', 'নবাবহাট', 'গুসকরা', 'ভাতার', 'হাওড়া', 'শিয়ালদহ', 'অনাময়', 'হাসপাতাল', 'মেডিকেল', 'স্টেশন', 'বাজার', 'এয়ারপোর্ট', 'বিমানবন্দর',
    'jamalpur', 'bardhaman', 'burdwan', 'memari', 'kolkata', 'airport', 'shaktigarh', 'tarapith', 'digha', 'howrah', 'sealdah',
    'থেকে', 'থেকেও', 'যাব', 'যাবে', 'যাবেন', 'যেতে', 'অব্দি', 'পর্যন্ত', 'পৌঁছাবে', 'পৌঁছাতে', 'from', 'to',
    'হলো', 'হবে', 'হচ্ছে', 'হল', 'হলেন', 'থাকে', 'আছে', 'is', 'was', 'are', 'named',
    'গাড়ি', 'গাড়ির', 'গাড়িতে', 'কার', 'car', 'cab', 'taxi', 'ট্যাক্সি', 'স্করপিও', 'ওয়াগন', 'ডিজায়ার', 'রুমিয়ন', 'আর্টিগা', 'scorpio', 'wagonr', 'dzire', 'ertiga', 'rumion',
    'ড্রাইভার', 'চালক', 'ড্রাইভারের', 'driver',
    'টাকা', 'ভাড়া', 'ভাড়া', 'টাকায়', 'rate', 'fare', 'price',
    'ফোন', 'মোবাইল', 'নম্বর', 'নাম্বার', 'phone', 'mobile', 'call', 'contact', 'number', 'no',
    'সকাল', 'রাত', 'দুপুর', 'বিকেল', 'সন্ধ্যা', 'সন্ধা', 'ভোর', 'morning', 'afternoon', 'evening', 'night',
    'আজ', 'আজকে', 'কাল', 'কালকে', 'আগামীকাল', 'পরশু', 'পরশুদিন', 'today', 'tomorrow', 'তারিখ',
    'বুকিং', 'booking', 'ট্রিপ', 'trip', 'ট্যুর', 'tour', 'লোকাল', 'local',
    'এসি', 'নন-এসি', 'ac', 'non-ac', 'সিটার', 'seater', '৭', '৯', '৫', '7', '9', '5', 'না', 'হ্যাঁ', 'yes', 'no'
  ]);

  // Clean a candidate string (remove trailing punctuation, stop words, honorifics)
  const cleanCandidate = (candidate: string): string => {
    let text = candidate.replace(/[.,/#!$%^&*;:{}=\-_`~()|।!?+]/g, ' ').replace(/\s+/g, ' ').trim();
    // Strip leading connectors
    text = text.replace(/^(?:হলো|হবে|হচ্ছে|হল|হলেন|থাকে|is|was|are|named|called|of)\s+/i, '');
    // Strip leading honorifics
    text = text.replace(/^(?:শ্রী|শ্রীযুক্ত|শ্রীমতি|মিস্টার|মিঃ|মিস্টার্স|সাহেব|mr\.?|mrs\.?|ms\.?|shri|dr\.?|md\.?|sk\.?)\s+/i, '');
    // Strip trailing honorifics
    text = text.replace(/\s+(?:বাবু|বাবুটি|বাবুড়|মহাশয়|সাহেব|দা)$/i, '');
    // Strip trailing boundary words if any leaked through
    text = text.replace(/\s+(?:ফোন|মোবাইল|phone|mobile|নম্বর|নাম্বার|number|থেকে|from|যাব|যাবে|যাবেন|to|ড্রাইভার|চালক|driver|টাকা|ভাড়া|ভাড়া|সকাল|রাত|আজ|কাল).*/i, '');
    return text.trim();
  };

  const isValidName = (name: string): boolean => {
    if (!name || name.length < 2) return false;
    const lowerName = name.toLowerCase();
    if (STOP_WORDS.has(lowerName)) return false;
    if (driverName && (lowerName.includes(driverName.toLowerCase()) || driverName.toLowerCase().includes(lowerName))) {
      return false;
    }
    // If it has too many digits
    const digitsOnly = name.replace(/\D/g, '');
    if (digitsOnly.length >= 3) return false;

    // Check if tokens are all stop words
    const words = name.split(/\s+/);
    if (words.length === 0) return false;
    const validWords = words.filter(w => !STOP_WORDS.has(w.toLowerCase()));
    return validWords.length > 0;
  };

  // Pattern 1: Explicit prefix markers:
  // "যাত্রীর নাম [নাম]", "যাত্রী [নাম]", "যাত্রীটি [নাম]", "কাস্টমারের নাম [নাম]", "কাস্টমার [নাম]", "প্যাসেঞ্জার [নাম]", "গ্রাহকের নাম [নাম]", "গ্রাহক [নাম]", "বুকিং নাম [নাম]"
  // English: "passenger name [name]", "passenger is [name]", "passenger [name]", "customer name [name]", "customer is [name]", "customer [name]", "client name [name]", "booking name [name]"
  const prefixRegex = /(?:যাত্রীর?\s*নাম|যাত্রীটি|যাত্রী|কাস্টমারের?\s*নাম|কাস্টমার|প্যাসেঞ্জারের?\s*নাম|প্যাসেঞ্জার|গ্রাহকের?\s*নাম|গ্রাহক|বুকিং\s*নাম|passenger\s*name|passenger\s*is|passenger|customer\s*name|customer\s*is|customer|client\s*name|client|booking\s*name)\s*(?:হলেন|হচ্ছে|হলো|হল|হবে|is|was|:|–|-)?\s*([^\s,।!?\n]+(?:\s+[^\s,।!?\n]+){0,3})/gi;

  let match;
  while ((match = prefixRegex.exec(raw)) !== null) {
    if (match[1]) {
      const candidate = cleanCandidate(match[1]);
      if (isValidName(candidate)) {
        return candidate;
      }
    }
  }

  // Pattern 2: Standalone "নাম [নাম]" / "name is [name]" (with word boundary to NEVER match "নাম্বার")
  const standAloneNameRegex = /(?:^|[\s,।])(?:নাম|নামটি|name)\s*(?:হলো|হবে|হচ্ছে|হল|হলেন|is|:)\s*([^\s,।!?\n]+(?:\s+[^\s,।!?\n]+){0,3})/gi;
  while ((match = standAloneNameRegex.exec(raw)) !== null) {
    if (match[1]) {
      const candidate = cleanCandidate(match[1]);
      if (isValidName(candidate)) {
        return candidate;
      }
    }
  }

  // Pattern 3: Suffix markers: "[নাম] বাবুর বুকিং" / "[নাম] বাবুর গাড়ি" / "[নাম] এর বুকিং" / "[নাম] এর গাড়ি"
  const suffixRegex = /([^\s,।!?\n]+(?:\s+[^\s,।!?\n]+){0,2})\s*(?:বাবুর\s*বুকিং|বাবুর\s*গাড়ি|বাবুর\s*জন্য|এর\s*বুকিং|এর\s*গাড়ি|এর\s*জন্য\s*গাড়ি)/gi;
  while ((match = suffixRegex.exec(raw)) !== null) {
    if (match[1]) {
      const candidate = cleanCandidate(match[1]);
      if (isValidName(candidate)) {
        return candidate;
      }
    }
  }

  // Pattern 4: Spoken right before Phone Keyword: "[নাম] ফোন [নম্বর]" / "[নাম] মোবাইল [নম্বর]" / "[নাম] phone [number]"
  const beforePhoneRegex = /([^\s,।!?\n]+(?:\s+[^\s,।!?\n]+){0,2})\s*(?:ফোন|মোবাইল|phone|mobile|contact|call)\s*(?:হলো|হবে|is|:|–|-)?\s*(?:[০-৯0-9\s-]{6,})/gi;
  while ((match = beforePhoneRegex.exec(raw)) !== null) {
    if (match[1]) {
      const candidate = cleanCandidate(match[1]);
      if (isValidName(candidate)) {
        return candidate;
      }
    }
  }

  // Pattern 5: Sentence initial name before route: "[নাম] জামালপুর থেকে..."
  const initialMatch = raw.match(/^([^\s,।!?\n]+(?:\s+[^\s,।!?\n]+){0,2})\s+(?:থেকে|from|যাব|যাবে|যাবেন)/i);
  if (initialMatch && initialMatch[1]) {
    const candidate = cleanCandidate(initialMatch[1]);
    if (isValidName(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

/**
 * Parse full voice speech command for Bengali Trip & Dispatch:
 * Extracts into dedicated fields:
 * - Customer Name -> customerName (e.g. ANY spoken name: "যাত্রী সৌমেন পাল", "কাস্টমার রঞ্জন সাহা", "নাম তন্ময় ঘোষ")
 * - Customer Phone -> customerPhone (e.g. "ফোন ৯১৫৩৩০২৫১৭", "মোবাইল ৯৮৭৬৫৪৩২১০")
 * - Pickup location -> pickup (e.g. "জামালপুর থেকে", "বর্ধমান থেকে")
 * - Destination location -> destination (e.g. "বর্ধমানে যাব", "মেমারি বাজার", "কলকাতা বিমানবন্দর")
 * - Time slot -> timeSlot (e.g. "সকাল ৭ টায়", "বিকাল ৫টায়", "রাত ৯টায়", "ভোর ৫টায়")
 * - Date -> dateStr (e.g. "আজকে", "কালকে", "পরশু", "২৫ তারিখ")
 * - Car / Vehicle -> matchedCarId (e.g. "স্করপিও", "ওয়াগন আর", "ইনোভা")
 * - Driver -> driverName & driverPhone (e.g. "ড্রাইভার রাহুল", "চালক সুব্রত")
 */
export function parseBengaliVoiceCommand(
  transcript: string,
  drivers: DriverProfile[] = [],
  cars: FleetCar[] = []
): VoiceParsedResult {
  if (!transcript || !transcript.trim()) {
    return {
      rawTranscript: '',
      pickup: 'জামালপুর (Jamalpur)',
      destination: 'বর্ধমান স্টেশন (Burdwan Station)',
      timeSlot: '07:00 AM',
      confidence: 0
    };
  }

  const clean = normalizeText(transcript);
  const driverMatch = matchDriverFromTranscript(transcript, drivers);
  const phone = extractPhoneNumber(transcript);
  const detectedDate = extractDateFromSpeech(transcript);
  const detectedCarId = extractCarFromSpeech(transcript, cars);

  // 1. Detect Universal Customer Name (Works with ANY novel or spoken name)
  const detectedCustomerName = extractCustomerNameFromSpeech(transcript, driverMatch.name);

  // 2. Detect Pickup / From Location
  let detectedPickup: string | undefined;
  
  // Pattern 1: "[স্থান] থেকে" or "from [location]" or "পিকআপ [স্থান]"
  const pickupMatch = transcript.match(/([^\s,।]+(?:\s+[^\s,।]+)?)\s*থেকে/i) ||
                      transcript.match(/(?:পিকআপ|pickup|starting\s*point|উৎস|শুরু|from)\s*(?:হলো|হবে|location|:)?\s*([^\s,।]+(?:\s+[^\s,।]+)?)/i) ||
                      transcript.match(/([^\s,।]+(?:\s+[^\s,।]+)?)\s*(?:টু|to)\s*[^\s,।]+/i);
  
  if (pickupMatch && pickupMatch[1]) {
    let rawPick = pickupMatch[1].trim();
    rawPick = rawPick.replace(/(?:আজ|কাল|সকাল|রাত|যাত্রী|কাস্টমার).*/i, '').trim();
    const excludedLocations = ['আজ', 'কাল', 'সকাল', 'রাত', 'দুপুর', 'বিকেল', 'এখানে', 'ওখান', 'গাড়ি', 'ড্রাইভার', 'ফোন', 'যাত্রী'];
    if (!excludedLocations.includes(rawPick.toLowerCase()) && rawPick.length >= 2) {
      detectedPickup = rawPick.includes('জামালপুর') ? 'জামালপুর (Jamalpur)' : rawPick;
    }
  }

  // 3. Detect Destination / To Location
  let detectedDest: string | undefined;
  
  // Pattern: "[স্থান] যাব / যাবে / যাবেন / অব্দি / পর্যন্ত" or "গন্তব্য [স্থান]" or "to [location]"
  const toDestMatch = transcript.match(/([^\s,।]+(?:\s+[^\s,।]+)?)\s*(?:যাবে|যাব|যাবেন|পর্যন্ত|অব্দি|যেতে\s*হবে|পৌঁছাবে)/i) ||
                      transcript.match(/(?:গন্তব্য|destination|ড্রপ|ড্রপ\s*লোকেশন|to)\s*(?:হলো|হবে|স্থান|:)?\s*([^\s,।]+(?:\s+[^\s,।]+)?)/i) ||
                      transcript.match(/(?:থেকে|from)\s*[^\s,।]+\s*(?:টু|to)\s*([^\s,।]+(?:\s+[^\s,।]+)?)/i);
  
  if (toDestMatch && toDestMatch[1]) {
    const rawDest = toDestMatch[1].trim();
    const excludedDests = ['গাড়ি', 'ড্রাইভার', 'আজ', 'কাল', 'সকাল', 'রাত', 'টাকা', 'হলো', 'হবে', 'ফোন', 'মোবাইল'];
    if (!excludedDests.includes(rawDest.toLowerCase()) && rawDest.length >= 2) {
      detectedDest = rawDest;
    }
  }

  // Destination fallback matching with popular destinations directory
  if (!detectedDest) {
    for (const dest of POPULAR_LOCAL_DESTINATIONS) {
      const bnNorm = normalizeText(dest.nameBn);
      const enNorm = normalizeText(dest.nameEn);
      
      if (clean.includes(bnNorm) || clean.includes(enNorm)) {
        detectedDest = dest.nameBn;
        break;
      }
      if (clean.includes('বর্ধমান') || clean.includes('burdwan') || clean.includes('bardhaman')) {
        detectedDest = clean.includes('মেডিকেল') ? 'বর্ধমান মেডিকেল কলেজ (অনাময়)' : 'বর্ধমান স্টেশন / টাউন';
        break;
      }
      if (clean.includes('মেমারি') || clean.includes('memari')) {
        detectedDest = 'মেমারি বাজার ও স্টেশন';
        break;
      }
      if (clean.includes('শক্তিগড়') || clean.includes('shaktigarh')) {
        detectedDest = 'শক্তিগড় ল্যাংচা হাব';
        break;
      }
      if (clean.includes('কলকাতা') || clean.includes('kolkata') || clean.includes('airport') || clean.includes('বিমানবন্দর') || clean.includes('এয়ারপোর্ট')) {
        detectedDest = 'কলকাতা বিমানবন্দর (CCU)';
        break;
      }
      if (clean.includes('তারাপীঠ') || clean.includes('tarapith')) {
        detectedDest = 'তারাপীঠ মন্দির';
        break;
      }
      if (clean.includes('মায়াপুর') || clean.includes('mayapur') || clean.includes('ইসকন')) {
        detectedDest = 'মায়াপুর ইসকন মন্দির';
        break;
      }
      if (clean.includes('কালনা') || clean.includes('kalna')) {
        detectedDest = 'কালনা ১০৮ শিবমন্দির';
        break;
      }
      if (clean.includes('নবাবহাট') || clean.includes('nababhat')) {
        detectedDest = 'নবাবহাট বাস টার্মিনাস';
        break;
      }
      if (clean.includes('দিঘা') || clean.includes('digha')) {
        detectedDest = 'দিঘা সমুদ্র সৈকত';
        break;
      }
      if (clean.includes('বিয়ে') || clean.includes('বিবাহ') || clean.includes('বিয়েবাড়ি') || clean.includes('wedding')) {
        detectedDest = 'লোকাল বিবাহ বাড়ি / অনুষ্ঠান';
        break;
      }
    }
  }

  // 4. Detect Time Slot (e.g. "সকাল ৭ টা", "সকাল ৮:৩০", "বিকাল ৫ টা", "রাত ৯ টা", "দুপুর ১২ টা", "ভোর ৫ টা")
  let detectedTime: string | undefined;
  const textWithAscii = convertBengaliDigitsToAscii(transcript);
  
  const timePattern = /(?:(সকাল|ভোর|দুপুর|বিকেল|সন্ধ্যা|সন্ধা|রাত|morning|afternoon|evening|night)\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:টা|টার|টায়|am|pm|baje)?/i;
  const timeMatch = textWithAscii.match(timePattern);

  if (timeMatch && timeMatch[2]) {
    let hour = parseInt(timeMatch[2], 10);
    const minute = timeMatch[3] ? timeMatch[3] : '00';
    const periodWord = (timeMatch[1] || '').toLowerCase();

    if (hour >= 1 && hour <= 24) {
      if (hour > 12) {
        detectedTime = `${String(hour - 12).padStart(2, '0')}:${minute} PM`;
      } else if (periodWord.includes('রাত') || periodWord.includes('সন্ধ্যা') || periodWord.includes('বিকেল') || periodWord.includes('সন্ধা') || periodWord.includes('evening') || periodWord.includes('night')) {
        detectedTime = `${String(hour).padStart(2, '0')}:${minute} PM`;
      } else if (periodWord.includes('দুপুর') || periodWord.includes('afternoon')) {
        detectedTime = `${String(hour === 12 ? 12 : hour).padStart(2, '0')}:${minute} PM`;
      } else if (periodWord.includes('সকাল') || periodWord.includes('ভোর') || periodWord.includes('morning')) {
        detectedTime = `${String(hour).padStart(2, '0')}:${minute} AM`;
      } else {
        if (hour >= 6 && hour <= 11) {
          detectedTime = `${String(hour).padStart(2, '0')}:${minute} AM`;
        } else {
          detectedTime = `${String(hour).padStart(2, '0')}:${minute} PM`;
        }
      }
    }
  }

  // Fallback keyword time slots
  if (!detectedTime) {
    if (clean.includes('ভোর') || clean.includes('early morning')) {
      detectedTime = '05:00 AM';
    } else if (clean.includes('সকাল') || clean.includes('morning')) {
      detectedTime = '07:00 AM';
    } else if (clean.includes('দুপুর') || clean.includes('afternoon')) {
      detectedTime = '01:30 PM';
    } else if (clean.includes('বিকেল') || clean.includes('সন্ধ্যা') || clean.includes('evening')) {
      detectedTime = '05:30 PM';
    } else if (clean.includes('রাত') || clean.includes('night')) {
      detectedTime = '08:30 PM';
    }
  }

  return {
    rawTranscript: transcript,
    matchedDriver: driverMatch.driver,
    driverName: driverMatch.driver?.name || driverMatch.name,
    driverPhone: driverMatch.driver?.phone || (driverMatch.name && phone ? phone : undefined),
    matchedCarId: detectedCarId,
    pickup: detectedPickup || 'জামালপুর (Jamalpur)',
    destination: detectedDest || 'বর্ধমান স্টেশন (Burdwan Station)',
    customerName: detectedCustomerName,
    customerPhone: phone,
    dateStr: detectedDate,
    timeSlot: detectedTime || '07:00 AM',
    tripType: (detectedDest?.includes('বিবাহ') || clean.includes('বিয়ে') || clean.includes('বিবাহ')) ? 'Wedding / Biyebari' : 'Local Day Trip',
    notes: '', // Keep notes field clean and empty for optional custom notes
    confidence: driverMatch.confidence || (detectedDest ? 0.85 : 0.5)
  };
}

/**
 * Generate formatted WhatsApp Trip Dispatch message for Driver (without Fare)
 */
export function generateDriverWhatsAppDispatchSlip(params: {
  dateFormatted: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  pickup: string;
  destination: string;
  vehicleCategory: string;
  driverName?: string;
  notes?: string;
}): string {
  const {
    dateFormatted,
    timeSlot,
    customerName,
    customerPhone,
    pickup,
    destination,
    vehicleCategory,
    driverName,
    notes
  } = params;

  return `🚖 *চলো যাই ট্যুর & ট্রাভেলস - নতুন ট্রিপ বরাদ্দ* 🚖\n` +
         `----------------------------------------\n` +
         `📅 *তারিখ:* ${dateFormatted}\n` +
         `⏰ *সময়:* ${timeSlot}\n` +
         `👤 *যাত্রী:* ${customerName}\n` +
         `📞 *যাত্রীর ফোন:* ${customerPhone}\n` +
         `📍 *পিকআপ (From):* ${pickup}\n` +
         `🏁 *গন্তব্য (To):* ${destination}\n` +
         `🚗 *গাড়ি:* ${vehicleCategory}\n` +
         (driverName ? `👨‍✈️ *অ্যাসাইনড ড্রাইভার:* ${driverName}\n` : '') +
         (notes ? `📝 *নোট:* ${notes}\n` : '') +
         `----------------------------------------\n` +
         `📌 *অফিস:* জামালপুর, পূর্ব বর্ধমান\n` +
         `📞 *হেল্পলাইন:* 9153302517\n` +
         `দয়া করে সময়ে পৌঁছে যাত্রীকে ফোন করুন। শুভ যাত্রা! 🙏`;
}

/**
 * Initialize Speech Recognition instance with rock-solid error handling, mobile audio permissions & multi-locale support
 */
export function createBengaliSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  language: string = 'bn-IN'
): { start: () => Promise<void>; stop: () => void; isListening: () => boolean } {
  const SpeechRecognitionClass = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return {
      start: async () => onError('আপনার ব্রাউজার সরাসরি ভয়েস রিকগনিশন সমর্থন করে না। আপনি নিচের রেডি টেমপ্লেট অথবা কীবোর্ডের মাইক দিয়ে ইনপুট করতে পারেন।'),
      stop: () => {},
      isListening: () => false
    };
  }

  let recognition: any = null;
  let listening = false;

  const initRecognizer = () => {
    try {
      recognition = new SpeechRecognitionClass();
      recognition.lang = language || 'bn-IN';
      recognition.continuous = false; // continuous = false avoids hanging on mobile WebKit/Chrome
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript || '').trim();
        if (currentText) {
          onResult(currentText, Boolean(finalTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onError('মাইক্রোফোন অনুমতি বন্ধ আছে। মোবাইলের ব্রাউজার সেটিংসে Microphone Allow করুন অথবা নিচের টেমপ্লেটে ক্লিক করুন।');
        } else if (event.error === 'no-speech') {
          // No speech detected, graceful
        } else if (event.error === 'network') {
          onError('ইন্টারনেট সংযোগ চেক করুন অথবা নিচের রেডি টেমপ্লেট ব্যবহার করুন।');
        } else {
          onError(`ভয়েস রিকগনিশন বার্তা (${event.error})।`);
        }
      };

      recognition.onend = () => {
        listening = false;
        onEnd();
      };
    } catch (e: any) {
      console.warn('Failed to initialize SpeechRecognition:', e);
    }
  };

  initRecognizer();

  return {
    start: async () => {
      try {
        // Request microphone permission on mobile/desktop first
        const perm = await requestMicrophonePermission();
        if (!perm.granted && perm.error) {
          onError(perm.error);
          return;
        }

        if (!recognition) initRecognizer();
        listening = true;
        recognition.start();
      } catch (err: any) {
        console.warn('Recognition start exception:', err);
        try {
          initRecognizer();
          recognition.start();
          listening = true;
        } catch (e2) {
          onError('মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে মাইকে ট্যাপ করে মাইক্রোফোন অনুমতি দিন।');
        }
      }
    },
    stop: () => {
      try {
        listening = false;
        if (recognition) {
          recognition.stop();
        }
      } catch (err) {
        // ignore
      }
    },
    isListening: () => listening
  };
}

