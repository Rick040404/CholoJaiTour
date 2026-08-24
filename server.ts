import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Persistent JSON file path for multi-device sync
const DATA_FILE = path.join(process.cwd(), 'server_data.json');

// Default initial data structure
interface DataStore {
  bookings: Array<{
    id: string;
    name: string;
    phone: string;
    car: string;
    pickup: string;
    destination: string;
    date: string;
    timeSlot?: string;
    tripType: string;
    isAc: boolean;
    advanceAmount?: string;
    fareEstimate?: string;
    status: string;
    createdAt: string;
    notes?: string;
  }>;
  schedules: Array<{
    carId: string;
    dateStr: string;
    status: string;
    customerName?: string;
    customerPhone?: string;
    pickup?: string;
    destination?: string;
    timeSlot?: string;
    fareEstimate?: string;
    advanceAmount?: string;
    driverName?: string;
    driverPhone?: string;
    tripType?: string;
    notes?: string;
  }>;
  notice: {
    enabled: boolean;
    text: string;
    textBn: string;
    theme: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
  };
  adminPassword?: string;
  lastUpdated: number;
}

const defaultData: DataStore = {
  bookings: [],
  schedules: [],
  notice: {
    enabled: true,
    text: '🎉 Special Discount on Digha, Puri & Darjeeling Outstation Tours! Call 9153302517 for 24x7 instant booking.',
    textBn: '🎉 দিঘা, পুরী ও দার্জিলিং ট্যুরের বুকিংয়ে বিশেষ সুবিধা! ২৪x৭ বুকিংয়ের জন্য ৯১৫৩৩০২৫১৭ নম্বরে সরাসরি ফোন করুন।',
    theme: 'amber'
  },
  adminPassword: '04048555',
  lastUpdated: Date.now()
};

// Helper to read data safely
function readStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading server data:', err);
  }
  return defaultData;
}

// Helper to write data safely
function writeStore(data: DataStore) {
  try {
    data.lastUpdated = Date.now();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing server data:', err);
  }
}

// Ensure store file exists on startup
if (!fs.existsSync(DATA_FILE)) {
  writeStore(defaultData);
}

// ================= API ROUTES (Cross-Device Sync) =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Full store fetch for cross-device synchronization
app.get('/api/data', (req, res) => {
  const store = readStore();
  res.json(store);
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  const store = readStore();
  res.json({ bookings: store.bookings, lastUpdated: store.lastUpdated });
});

// Create or save a new booking
app.post('/api/bookings', (req, res) => {
  const store = readStore();
  const booking = req.body;
  if (!booking || !booking.id) {
    return res.status(400).json({ error: 'Invalid booking data' });
  }

  // If already exists, update it; otherwise add to top
  const existingIdx = store.bookings.findIndex(b => b.id === booking.id);
  if (existingIdx >= 0) {
    store.bookings[existingIdx] = { ...store.bookings[existingIdx], ...booking };
  } else {
    store.bookings = [booking, ...store.bookings];
  }

  writeStore(store);
  res.json({ success: true, bookings: store.bookings, lastUpdated: store.lastUpdated });
});

// Update a booking
app.put('/api/bookings/:id', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  const updatedBooking = req.body;

  const idx = store.bookings.findIndex(b => b.id === id);
  if (idx >= 0) {
    store.bookings[idx] = { ...store.bookings[idx], ...updatedBooking };
    writeStore(store);
    res.json({ success: true, booking: store.bookings[idx], bookings: store.bookings });
  } else {
    // If not found, add it
    store.bookings = [{ ...updatedBooking, id }, ...store.bookings];
    writeStore(store);
    res.json({ success: true, booking: updatedBooking, bookings: store.bookings });
  }
});

// Delete a booking
app.delete('/api/bookings/:id', (req, res) => {
  const store = readStore();
  const id = req.params.id;
  store.bookings = store.bookings.filter(b => b.id !== id);
  writeStore(store);
  res.json({ success: true, bookings: store.bookings, lastUpdated: store.lastUpdated });
});

// Get all 4-day schedules
app.get('/api/schedules', (req, res) => {
  const store = readStore();
  res.json({ schedules: store.schedules, lastUpdated: store.lastUpdated });
});

// Update or set a car schedule
app.post('/api/schedules', (req, res) => {
  const store = readStore();
  const schedule = req.body;
  if (!schedule || !schedule.carId || !schedule.dateStr) {
    return res.status(400).json({ error: 'Missing carId or dateStr' });
  }

  const existingIdx = store.schedules.findIndex(
    s => s.carId === schedule.carId && s.dateStr === schedule.dateStr
  );

  if (existingIdx >= 0) {
    store.schedules[existingIdx] = { ...store.schedules[existingIdx], ...schedule };
  } else {
    store.schedules.push(schedule);
  }

  writeStore(store);
  res.json({ success: true, schedules: store.schedules, lastUpdated: store.lastUpdated });
});

// Batch update schedules
app.post('/api/schedules/batch', (req, res) => {
  const store = readStore();
  const incomingSchedules = req.body.schedules;
  if (Array.isArray(incomingSchedules)) {
    store.schedules = incomingSchedules;
    writeStore(store);
  }
  res.json({ success: true, schedules: store.schedules, lastUpdated: store.lastUpdated });
});

// Get notice config
app.get('/api/notice', (req, res) => {
  const store = readStore();
  res.json({ notice: store.notice, lastUpdated: store.lastUpdated });
});

// Update notice config
app.post('/api/notice', (req, res) => {
  const store = readStore();
  if (req.body) {
    store.notice = { ...store.notice, ...req.body };
    writeStore(store);
  }
  res.json({ success: true, notice: store.notice });
});

// Update admin password
app.post('/api/password', (req, res) => {
  const store = readStore();
  const { newPassword } = req.body;
  if (newPassword && newPassword.length >= 4) {
    store.adminPassword = newPassword;
    writeStore(store);
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Password too short' });
});

// Two-way sync merge endpoint
app.post('/api/sync', (req, res) => {
  const store = readStore();
  const clientData = req.body;

  let modified = false;

  // Merge client bookings if newer or missing
  if (Array.isArray(clientData.bookings)) {
    const serverIds = new Set(store.bookings.map(b => b.id));
    for (const b of clientData.bookings) {
      if (b && b.id && !serverIds.has(b.id)) {
        store.bookings.push(b);
        modified = true;
      }
    }
  }

  // Merge schedules
  if (Array.isArray(clientData.schedules)) {
    for (const s of clientData.schedules) {
      if (s && s.carId && s.dateStr) {
        const found = store.schedules.find(
          item => item.carId === s.carId && item.dateStr === s.dateStr
        );
        if (!found) {
          store.schedules.push(s);
          modified = true;
        }
      }
    }
  }

  if (modified) {
    writeStore(store);
  }

  res.json(store);
});

// ================= AI VOICE TRANSCRIPTION & SMART DISPATCH =================

app.post('/api/transcribe-voice', async (req, res) => {
  try {
    const { audioBase64, mimeType, text, drivers, cars } = req.body;

    const ai = getGemini();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI API Key is not configured on the server. Please use local speech or templates.',
      });
    }

    const currentDateStr = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an expert multilingual audio transcriber and travel booking assistant for 'Cholo Jai Tour & Travels' located in Jamalpur, Purba Bardhaman, West Bengal.
Your task is to transcribe Bengali, Bengali-English mixed (Banglish), or English speech and extract all trip booking details into structured JSON.

Known Drivers: ${drivers ? JSON.stringify(drivers) : 'Rahul, Tapas, Baban, Shubhankar, Amit'}
Known Cars: ${cars ? JSON.stringify(cars) : 'Ertiga, Rumion Silver, Rumion White, Scorpio Classic, WagonR, Swift Dzire'}
Reference Date (Today): ${currentDateStr}

Rules:
1. transcript: Exact transcription of what the speaker said in Bengali/English.
2. customerName: Passenger / customer full name without words like "যাত্রী", "কাস্টমার", "নাম", "শ্রী", "বাবু". If none mentioned, return "".
3. customerPhone: 10-digit Indian mobile number. Convert all Bengali digits (০-৯) or spoken numbers to a 10-digit number. Return "" if none.
4. pickup: Starting point location (defaults to "জামালপুর" if not mentioned).
5. destination: Destination place (e.g. "বর্ধমান স্টেশন", "মেমারি", "কলকাতা বিমানবন্দর", "তারাপীঠ", "দিঘা", "বিবাহ বাড়ি").
6. timeSlot: Pickup time (e.g. "07:00 AM", "09:30 AM", "04:00 PM").
7. dateStr: Booking date in YYYY-MM-DD format. If speaker said "আজকে" or "today", use ${currentDateStr}. If "কালকে" or "tomorrow", use next day.
8. driverName: If any driver is requested or assigned (e.g. "রাহুল", "তাপস", "বাবান").
9. carType: Matching car or seat count if mentioned.
10. tripType: "Wedding / Biyebari", "Outstation Tour", or "Local Day Trip".
11. notes: Brief notes if any luggage or AC requirement mentioned. Otherwise "".`;

    let response;

    if (audioBase64) {
      // Multimodal audio transcription & entity extraction
      response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioBase64,
            },
          },
          {
            text: systemPrompt,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              customerName: { type: Type.STRING },
              customerPhone: { type: Type.STRING },
              pickup: { type: Type.STRING },
              destination: { type: Type.STRING },
              timeSlot: { type: Type.STRING },
              dateStr: { type: Type.STRING },
              driverName: { type: Type.STRING },
              carType: { type: Type.STRING },
              tripType: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['transcript', 'pickup', 'destination'],
          },
        },
      });
    } else if (text) {
      // Text parsing with Gemini
      response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            text: `${systemPrompt}\n\nParse this user command text:\n"${text}"`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              customerName: { type: Type.STRING },
              customerPhone: { type: Type.STRING },
              pickup: { type: Type.STRING },
              destination: { type: Type.STRING },
              timeSlot: { type: Type.STRING },
              dateStr: { type: Type.STRING },
              driverName: { type: Type.STRING },
              carType: { type: Type.STRING },
              tripType: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['transcript', 'pickup', 'destination'],
          },
        },
      });
    } else {
      return res.status(400).json({ error: 'No audio or text provided' });
    }

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/transcribe-voice:', err);
    res.status(500).json({ error: err.message || 'ভয়েস প্রসেসিং ব্যর্থ হয়েছে।' });
  }
});

// ================= VITE MIDDLEWARE & SERVER BOOTSTRAP =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cholo Jai Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
