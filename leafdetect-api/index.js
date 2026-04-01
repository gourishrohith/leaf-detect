require('dotenv').config()

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')
const { Jimp } = require('jimp')

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000
const JWT_SECRET = process.env.LEAFDETECT_JWT_SECRET || 'dev-secret-change-me'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const DB_PATH = path.join(__dirname, 'db.json')
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2), 'utf8')
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
}

function signToken(userId) {
  return jwt.sign({ sub: String(userId), iss: 'leafdetect' }, JWT_SECRET, { expiresIn: '7d' })
}

function requireAuth(req, res, next) {
  const auth = req.header('Authorization') || ''
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ detail: 'Missing token' })
  const token = auth.slice('Bearer '.length).trim()
  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: 'leafdetect' })
    req.userId = Number(payload.sub)
    next()
  } catch {
    return res.status(401).json({ detail: 'Invalid token' })
  }
}

function userOut(u) {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    purpose: u.purpose,
    wantsChemicals: !!u.wantsChemicals,
  }
}

async function extractSignals(buf) {
  const img = await Jimp.read(buf)
  img.resize({ w: 320 })
  let sumR = 0, sumG = 0, sumB = 0, sum = 0
  let sumL = 0, sumL2 = 0
  const { width, height, data } = img.bitmap
  const n = width * height
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    sumR += r; sumG += g; sumB += b
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sumL += l
    sumL2 += l * l
    sum += (r + g + b)
  }
  const meanR = sumR / n
  const meanG = sumG / n
  const meanB = sumB / n
  const total = Math.max(meanR + meanG + meanB, 1e-6)
  const greenRatio = meanG / total
  const redness = (meanR - meanG) / total
  const meanL = sumL / n
  const variance = Math.max(0, (sumL2 / n) - meanL * meanL)
  const contrast = Math.sqrt(variance) / 255
  return { greenRatio, redness, contrast }
}

function diagnose(s) {
  if (s.greenRatio > 0.39 && s.redness < 0.02 && s.contrast < 0.20) {
    return {
      healthy: true,
      likelyIssue: 'Healthy leaf',
      confidence: 0.78,
      explanation: 'Color balance and texture look consistent with a healthy leaf in this image.',
    }
  }
  if (s.redness > 0.05) {
    return {
      healthy: false,
      likelyIssue: 'Possible nutrient deficiency / stress (yellowing or reddening)',
      confidence: 0.68,
      explanation: 'Higher red component relative to green can happen with stress, deficiency, or aging leaves.',
    }
  }
  if (s.contrast > 0.25) {
    return {
      healthy: false,
      likelyIssue: 'Possible fungal/bacterial spotting',
      confidence: 0.71,
      explanation: 'Higher texture contrast can indicate spotting/lesion patterns. Inspect both sides of the leaf.',
    }
  }
  return {
    healthy: false,
    likelyIssue: 'Possible early-stage issue',
    confidence: 0.60,
    explanation: 'Signals are mixed. Try brighter lighting and a closer shot of the affected area.',
  }
}

function inferPlantNameFromSignals(s) {
  if (s.greenRatio > 0.42) return { plantName: 'Likely spinach/leafy green', plantConfidence: 0.58 }
  if (s.redness > 0.06) return { plantName: 'Likely tomato/chili family', plantConfidence: 0.56 }
  if (s.contrast > 0.24) return { plantName: 'Likely brinjal/eggplant type leaf', plantConfidence: 0.54 }
  return { plantName: 'Unknown plant (need clearer image)', plantConfidence: 0.5 }
}

function remedyPack({ wantsChemicals, purpose }) {
  const home = [
    'Remove heavily affected leaves and dispose (don’t compost if infection is suspected).',
    'Avoid overhead watering; water the soil early morning.',
    'Improve airflow by spacing plants and pruning dense growth.',
    'Wipe tools with alcohol between plants to reduce spread.',
  ]
  const chemical = [
    'Use a crop-appropriate fungicide/bactericide (follow label, PPE, and pre-harvest intervals).',
    'Rotate active ingredients to reduce resistance risk.',
    'Treat early and repeat per label schedule if symptoms persist.',
  ]
  const prevention = [
    'Inspect plants weekly and isolate new plants for a few days.',
    'Keep leaves dry when possible; reduce humidity and improve ventilation.',
    'Clean up plant debris at end of season; rotate crops if recurring.',
  ]
  if (purpose === 'farmer') {
    prevention.unshift('Track outbreaks by plot; remove hotspots quickly to limit spread.')
    home.unshift('Scout a wider sample across the field to confirm pattern, not a single plant.')
  }
  return {
    remedies: { home, chemical: wantsChemicals ? chemical : [] },
    prevention,
  }
}

function fallbackAnalysisFromHeuristic(fileBuffer, wantsChemicals, purpose) {
  return extractSignals(fileBuffer).then((s) => {
    const d = diagnose(s)
    const p = inferPlantNameFromSignals(s)
    const rp = remedyPack({ wantsChemicals, purpose })
    if (d.healthy) {
      return {
        ...p,
        ...d,
        remedies: {
          home: ['Keep consistent watering and avoid wetting leaves late in the day.'],
          chemical: ['No chemical treatment recommended for a healthy leaf.'],
        },
        prevention: [
          'Maintain consistent watering and adequate sunlight.',
          'Keep tools clean and inspect plants weekly.',
          'Avoid overcrowding to improve airflow.',
        ],
      }
    }
    return { ...p, ...d, ...rp }
  })
}

function cleanJson(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return null

  // Common model behavior: wraps JSON in markdown code fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : trimmed

  try {
    return JSON.parse(candidate)
  } catch {
    const firstBrace = candidate.indexOf('{')
    const lastBrace = candidate.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function normalizeGeminiPayload(raw, wantsChemicals) {
  if (!raw || typeof raw !== 'object') return null
  const plantName = String(raw.plantName || '').trim()
  const plantConfidence = Number(raw.plantConfidence)
  const healthy = Boolean(raw.healthy)
  const likelyIssue = String(raw.likelyIssue || '').trim()
  const explanation = String(raw.explanation || '').trim()
  const confidence = Number(raw.confidence)
  const home = Array.isArray(raw?.remedies?.home) ? raw.remedies.home.map((x) => String(x)) : []
  const chemical = Array.isArray(raw?.remedies?.chemical) ? raw.remedies.chemical.map((x) => String(x)) : []
  const prevention = Array.isArray(raw.prevention) ? raw.prevention.map((x) => String(x)) : []

  if (!plantName || !likelyIssue || !explanation || !Number.isFinite(confidence)) return null
  if (home.length === 0 || prevention.length === 0) return null

  return {
    plantName,
    plantConfidence: Number.isFinite(plantConfidence)
      ? Math.max(0.3, Math.min(0.99, plantConfidence))
      : undefined,
    healthy,
    likelyIssue,
    confidence: Math.max(0.5, Math.min(0.98, confidence)),
    explanation,
    remedies: {
      home,
      chemical: wantsChemicals ? chemical : [],
    },
    prevention,
  }
}

async function analyzeWithGemini({ file, wantsChemicals, purpose }) {
  if (!GEMINI_API_KEY) return null
  if (typeof fetch !== 'function') return null

  // Provide Gemini with a lightweight, deterministic "second opinion" so it can
  // produce more image-specific and non-generic recommendations.
  let heuristic = null
  try {
    const s = await extractSignals(file.buffer)
    const d = diagnose(s)
    const p = inferPlantNameFromSignals(s)
    heuristic = {
      signals: {
        greenRatio: Number(s.greenRatio.toFixed(3)),
        redness: Number(s.redness.toFixed(3)),
        contrast: Number(s.contrast.toFixed(3)),
      },
      plantGuess: p,
      diagnosisGuess: d,
    }
  } catch {
    heuristic = null
  }

  const mime = file.mimetype || 'image/jpeg'
  const imageB64 = file.buffer.toString('base64')
  const prompt = [
    'You are a plant pathology assistant for a web app called LeafDetect.',
    'Analyze the leaf image and return strict JSON only (no markdown, no extra keys).',
    'Adapt recommendations for this user profile:',
    `- purpose: ${purpose}`,
    `- wantsChemicalRemedies: ${wantsChemicals}`,
    heuristic
      ? 'Heuristic signals + baseline guess (use as a hint; override if image disagrees):\n' +
        JSON.stringify(heuristic)
      : 'No heuristic hint available for this image.',
    'Output schema:',
    '{',
    '  "plantName": string,',
    '  "plantConfidence": number,',
    '  "healthy": boolean,',
    '  "likelyIssue": string,',
    '  "confidence": number,',
    '  "explanation": string,',
    '  "remedies": {',
    '    "home": string[],',
    '    "chemical": string[]',
    '  },',
    '  "prevention": string[]',
    '}',
    'Rules:',
    '- If uncertain, state likely issue and keep confidence moderate.',
    '- Keep guidance practical, safe, and realistic for small farms/home gardens.',
    '- IMPORTANT: Do NOT give generic repeated tips; each bullet must be specific to the likely issue + what the photo suggests.',
    '- Remedies must be "do this now" actions. Prevention must be "avoid future recurrence" actions. Avoid overlap.',
    '- Home remedies: 4 to 6 bullets. Each bullet should include a concrete action + a measurable detail (e.g., frequency, threshold, what to look for).',
    '- Chemical remedies: when wantsChemicalRemedies=true, include 2 to 4 bullets with active-ingredient families (e.g., copper, sulfur, chlorothalonil, mancozeb) and resistance-avoidance notes. Always say to follow label/PPE/PHI. When wantsChemicalRemedies=false, return an empty array.',
    '- Prevention: 4 to 6 bullets; include at least one sanitation step and one watering/humidity step when relevant.',
    '- Keep text short and plain-language; no long paragraphs.',
  ].join('\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mime,
                  data: imageB64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) return null
  const data = await response.json().catch(() => null)
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = cleanJson(text)
  const normalized = normalizeGeminiPayload(parsed, wantsChemicals)
  if (!normalized) return null

  // Final guardrails: dedupe, trim empties, and keep bullets tight.
  const uniq = (arr, max) => {
    const out = []
    const seen = new Set()
    for (const raw of Array.isArray(arr) ? arr : []) {
      const s = String(raw || '').replace(/\s+/g, ' ').trim()
      if (!s) continue
      const key = s.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(s)
      if (out.length >= max) break
    }
    return out
  }
  normalized.remedies.home = uniq(normalized.remedies.home, 6)
  normalized.remedies.chemical = wantsChemicals ? uniq(normalized.remedies.chemical, 4) : []
  normalized.prevention = uniq(normalized.prevention, 6)
  return normalized
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

app.post('/auth/signup', (req, res) => {
  const { name, email, password, purpose, wantsChemicals } = req.body || {}
  if (!name || !email || !password || !purpose) return res.status(400).send('Missing required fields')

  const db = readDb()
  const exists = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (exists) return res.status(409).send('Email already registered')

  const id = (db.users.at(-1)?.id || 0) + 1
  const user = {
    id,
    name: String(name),
    email: String(email),
    passwordHash: bcrypt.hashSync(String(password), 10),
    purpose: String(purpose),
    wantsChemicals: !!wantsChemicals,
  }
  db.users.push(user)
  writeDb(db)
  return res.json({ token: signToken(id), user: userOut(user) })
})

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).send('Missing email or password')

  const db = readDb()
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).send('Invalid email or password')
  }
  return res.json({ token: signToken(user.id), user: userOut(user) })
})

app.post('/analyze', requireAuth, upload.single('image'), async (req, res) => {
  const file = req.file
  if (!file) return res.status(400).send('Missing image')
  if (!SUPPORTED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
    return res
      .status(400)
      .send('Unsupported image format. Please upload JPG, PNG, or WEBP.')
  }

  const wantsChemicals = String(req.body?.wantsChemicals || 'false') === 'true'
  const purpose = String(req.body?.purpose || 'home_crop_grower')

  try {
    const aiResult = await analyzeWithGemini({ file, wantsChemicals, purpose })
    if (aiResult) return res.json(aiResult)

    const fallback = await fallbackAnalysisFromHeuristic(file.buffer, wantsChemicals, purpose)
    return res.json(fallback)
  } catch (e) {
    return res.status(400).send('Unable to process this image. Try a clear JPG/PNG/WEBP photo.')
  }
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LeafDetect API listening on http://localhost:${PORT}`)
})

