import { NextResponse } from "next/server"

const API_VERSION = "v1"
const MAX_RETRIES = 4
const MAX_500_RETRIES = 2
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000
const ANALYZE_PROMPT =
  'Verilen görseldeki atık veya eski malzemeyi analiz et. Return ONLY valid JSON. No explanation. No markdown. No extra text before or after JSON. Required schema: { "material_type": "string", "projects": ["string", "string", "string"], "difficulty": "Kolay|Orta|Zor" }'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
    status?: string
    code?: number
  }
}

type ModelListResponse = {
  models?: Array<{
    name?: string
    supportedGenerationMethods?: string[]
  }>
}

type AnalyzeResult = {
  material_type: string
  projects: string[]
  difficulty: string
}

let modelCache: { models: string[]; expiresAt: number } | null = null
let modelDiscoveryPromise: Promise<string[]> | null = null
const inFlightAnalyzeRequests = new Map<string, Promise<unknown>>()
const FALLBACK_ANALYZE_RESULT: AnalyzeResult = {
  material_type: "Bilinmeyen Malzeme",
  projects: ["Depolama Kutusu", "Duzenleyici", "Dekoratif Aksesuar"],
  difficulty: "Orta",
}
const MOCK_SCENARIOS: AnalyzeResult[] = [
  { material_type: "PET Plastik", projects: ["Saksi", "Kus Yemligi", "Kalemlik"], difficulty: "Kolay" },
  { material_type: "Ahsap / Sunta", projects: ["Duvar Rafi", "Kedi Evi", "Tepsi"], difficulty: "Orta" },
  { material_type: "Cam Sise", projects: ["Mumluk", "Teraryum", "Avize"], difficulty: "Zor" },
  {
    material_type: "Karton / Oluklu Mukavva",
    projects: ["Cekmece Duzenleyici", "Maket", "Kutu"],
    difficulty: "Kolay",
  },
  { material_type: "Aluminyum / Metal", projects: ["Ruzgar Cani", "Fener", "Saksi"], difficulty: "Orta" },
]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const backoffDelayMs = (attempt: number) => 1000 * 2 ** (attempt - 1)

const buildGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent`

function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function sanitizeGeminiPayload(payload: {
  prompt: string
  base64Data: string
  mimeType: string
  temperature?: number
  maxOutputTokens?: number
}) {
  const safeTemperature =
    typeof payload.temperature === "number" ? Math.min(Math.max(payload.temperature, 0), 1) : 0.2
  const safeMaxOutputTokens =
    typeof payload.maxOutputTokens === "number" ? Math.max(128, payload.maxOutputTokens) : 512

  return {
    contents: [
      {
        parts: [
          { text: payload.prompt },
          {
            inline_data: {
              mime_type: payload.mimeType,
              data: payload.base64Data,
            },
          },
        ],
      },
    ],
    generation_config: {
      temperature: safeTemperature,
      max_output_tokens: safeMaxOutputTokens,
    },
  }
}

function validateAnalyzeResult(value: unknown): AnalyzeResult | null {
  if (!value || typeof value !== "object") return null

  const candidate = value as Partial<AnalyzeResult>
  if (
    typeof candidate.material_type !== "string" ||
    typeof candidate.difficulty !== "string" ||
    !Array.isArray(candidate.projects)
  ) {
    return null
  }

  const sanitizedProjects = candidate.projects
    .filter((project): project is string => typeof project === "string")
    .slice(0, 3)

  if (sanitizedProjects.length === 0) {
    return null
  }

  return {
    material_type: candidate.material_type,
    projects: sanitizedProjects,
    difficulty: candidate.difficulty,
  }
}

function safeParse(text: string): AnalyzeResult {
  const normalized = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()

  const directParsed = safeJsonParse<unknown>(normalized, null)
  const directValidated = validateAnalyzeResult(directParsed)
  if (directValidated) return directValidated

  const match = normalized.match(/\{[\s\S]*\}/)
  if (match) {
    const extractedParsed = safeJsonParse<unknown>(match[0], null)
    const extractedValidated = validateAnalyzeResult(extractedParsed)
    if (extractedValidated) return extractedValidated
  }

  return FALLBACK_ANALYZE_RESULT
}

function getRandomMockScenario() {
  return MOCK_SCENARIOS[Math.floor(Math.random() * MOCK_SCENARIOS.length)]
}

async function getAvailableModels(apiKey: string) {
  const now = Date.now()
  if (modelCache && modelCache.expiresAt > now) {
    return modelCache.models
  }

  if (modelDiscoveryPromise) {
    return modelDiscoveryPromise
  }

  modelDiscoveryPromise = (async () => {
    const response = await fetch(`https://generativelanguage.googleapis.com/${API_VERSION}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
    })

    const rawBody = await response.text()
    const parsed = rawBody ? safeJsonParse<ModelListResponse>(rawBody, {}) : {}

    if (!response.ok) {
      throw new Error(
        `Model listesi alinamadi (${response.status}): ${
          rawBody || "Bos hata govdesi"
        }`,
      )
    }

    const availableModels = (parsed.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => model.name?.replace("models/", "").trim())
      .filter((name): name is string => Boolean(name))

    const uniqueModels = [...new Set(availableModels)]
    if (uniqueModels.length === 0) {
      throw new Error("generateContent destekleyen model bulunamadi.")
    }

    modelCache = {
      models: uniqueModels,
      expiresAt: now + MODEL_CACHE_TTL_MS,
    }

    return uniqueModels
  })()

  try {
    return await modelDiscoveryPromise
  } finally {
    modelDiscoveryPromise = null
  }
}

async function callGeminiWithResilience(base64Data: string, apiKey: string, modelsToTry: string[]) {
  let lastError: Error | null = null

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const geminiUrl = buildGeminiUrl(model)
      const payload = sanitizeGeminiPayload({
        prompt: ANALYZE_PROMPT,
        base64Data,
        mimeType: "image/jpeg",
      })

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      })

      if (geminiResponse.ok) {
        const rawBody = await geminiResponse.text()
        const parsedBody = rawBody ? safeJsonParse<GeminiResponse>(rawBody, {}) : {}
        return parsedBody
      }

      const rawBody = await geminiResponse.text()
      const parsedBody = rawBody ? safeJsonParse<GeminiResponse>(rawBody, {}) : {}

      const structuredError = {
        status: geminiResponse.status,
        apiVersion: API_VERSION,
        model,
        attempt,
        message: parsedBody.error?.message ?? "Unknown Gemini error",
        cause: parsedBody.error?.status ?? "UNKNOWN",
      }
      console.error("Gemini API error:", structuredError)

      if (geminiResponse.status === 400) {
        const invalidField = parsedBody.error?.message?.match(/Unknown name "([^"]+)"/)?.[1]
        console.error("Gemini INVALID_ARGUMENT field:", invalidField ?? "Unknown")
        throw new Error(
          `Gemini INVALID_ARGUMENT: ${parsedBody.error?.message ?? "Payload semasi gecersiz."}`,
        )
      }

      if (geminiResponse.status === 404) {
        lastError = new Error(`Model not found: ${model}`)
        break
      }

      if (geminiResponse.status === 429) {
        lastError = new Error("Gemini quota exhausted (429).")
        if (attempt < MAX_RETRIES) {
          await sleep(backoffDelayMs(attempt))
          continue
        }
      }

      if (geminiResponse.status === 503 && attempt < MAX_RETRIES) {
        lastError = new Error("Gemini service unavailable (503).")
        await sleep(backoffDelayMs(attempt))
        continue
      }

      if (geminiResponse.status >= 500 && attempt < MAX_500_RETRIES) {
        lastError = new Error("Gemini temporary server error.")
        await sleep(backoffDelayMs(attempt))
        continue
      }

      throw new Error(parsedBody.error?.message ?? "Gemini API request failed.")
    }
  }

  throw lastError ?? new Error("Gemini request failed for all fallback models.")
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY eksik." }, { status: 500 })
    }

    if (typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      return NextResponse.json({ error: "Gecersiz imageUrl." }, { status: 400 })
    }

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Resim URL indirilemedi." }, { status: 400 })
    }

    const arrayBuffer = await imageRes.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Resim boyutu cok buyuk (maks 8MB)." }, { status: 413 })
    }

    const base64Data = Buffer.from(arrayBuffer).toString("base64")
    const requestKey = `${imageUrl}:${arrayBuffer.byteLength}`

    let requestPromise = inFlightAnalyzeRequests.get(requestKey)
    if (!requestPromise) {
      requestPromise = (async () => {
        const availableModels = await getAvailableModels(apiKey)
        const data = await callGeminiWithResilience(base64Data, apiKey, availableModels)
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!aiText) {
          throw new Error("Gemini yaniti bos veya beklenen formatta degil.")
        }

        return safeParse(aiText)
      })()

      inFlightAnalyzeRequests.set(requestKey, requestPromise)
    }

    try {
      const parsedData = await requestPromise
      return NextResponse.json(parsedData, { status: 200 })
    } finally {
      inFlightAnalyzeRequests.delete(requestKey)
    }
  } catch (error) {
    console.error("Gemini Hatasi:", error)
    return NextResponse.json(getRandomMockScenario(), { status: 200 })
  }
}