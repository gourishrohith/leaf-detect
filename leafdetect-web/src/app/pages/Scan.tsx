import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { apiAnalyze, type AnalyzeResponse } from '../api/client'
import { Button } from '../components/Button'
import { useAuth } from '../state/auth'
import { CheckCircle2, AlertTriangle, UploadCloud, Wand2 } from 'lucide-react'

function formatPct(x: number) {
  return `${Math.round(x * 100)}%`
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

async function normalizeImageFile(input: File): Promise<File> {
  if (SUPPORTED_TYPES.includes(input.type)) return input

  const bitmap = await createImageBitmap(input)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to process image on this device.')
  ctx.drawImage(bitmap, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  bitmap.close()
  if (!blob) throw new Error('Unable to convert image format. Please use JPG, PNG, or WEBP.')
  return new File([blob], `${input.name.replace(/\.[^.]+$/, '') || 'leaf'}.jpg`, { type: 'image/jpeg' })
}

export function Scan() {
  const { token, user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  async function onAnalyze() {
    if (!token || !user || !file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const data = await apiAnalyze({
        token,
        image: file,
        wantsChemicals: user.wantsChemicals,
        purpose: user.purpose,
      })
      setResult({
        ...data,
        plantName: data.plantName?.trim() || 'Unknown plant (not confidently detected)',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      // Demo-friendly fallback if backend isn't running yet:
      if (msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('fetch')) {
        setResult({
          plantName: 'Likely tomato plant',
          plantConfidence: 0.66,
          healthy: false,
          likelyIssue: 'Possible fungal leaf spot',
          confidence: 0.72,
          explanation:
            'The photo shows patterns that often match fungal leaf spot (dark speckling / irregular lesions). This is a demo result when the API is offline.',
          remedies: {
            home: [
              'Remove heavily infected leaves and dispose (don’t compost).',
              'Avoid overhead watering; water the soil early morning.',
              'Spray neem oil (follow label) or mild baking-soda solution for prevention.',
            ],
            chemical: [
              'Use a suitable fungicide for leaf spot (follow label + crop compatibility).',
              'Improve field spacing and air-flow; sanitize tools between plants.',
            ],
          },
          prevention: [
            'Keep leaves dry when possible; improve airflow.',
            'Rotate crops and clean debris at the end of season.',
            'Quarantine new plants and inspect weekly.',
          ],
        })
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ld-accent-panel ld-pop-card rounded-3xl bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow)] sm:p-8"
      >
        <div className="text-xl font-semibold tracking-tight">Scan / Upload</div>
        <div className="mt-1 text-sm text-[rgb(var(--ld-muted))]">
          Upload a clear leaf photo. Good lighting and a close-up helps the analysis.
        </div>

        <label className="mt-6 block cursor-pointer">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0] ?? null
              setResult(null)
              setError(null)
              if (!f) {
                setFile(null)
                return
              }

              try {
                const normalized = await normalizeImageFile(f)
                setFile(normalized)
              } catch {
                setFile(null)
                setError('Unsupported image format. Use camera capture, JPG, PNG, or WEBP.')
              }
            }}
          />
          <div className="ld-pop-card group rounded-2xl border border-dashed border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-5 hover:shadow-[var(--ld-shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[rgb(var(--ld-panel))] border border-[rgb(var(--ld-border))]">
                <UploadCloud className="h-5 w-5 opacity-80" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {file ? 'Replace image' : 'Choose an image'}
                </div>
                <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                  On phone, this opens camera directly. JPG/PNG/WEBP supported.
                </div>
              </div>
            </div>
          </div>
        </label>

        {previewUrl ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40">
            <img src={previewUrl} alt="Leaf preview" className="h-64 w-full object-cover" />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-5 text-sm text-[rgb(var(--ld-muted))]">
            Tip: Place the leaf on a plain background (paper) for better results.
          </div>
        )}

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button className="w-full sm:w-auto" onClick={onAnalyze} disabled={!file || busy}>
            <Wand2 className="h-4 w-4" />
            {busy ? 'Analyzing…' : 'Analyze leaf'}
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="secondary"
            disabled={!file || busy}
            onClick={() => {
              setFile(null)
              setResult(null)
              setError(null)
            }}
          >
            Clear
          </Button>
        </div>

        <div className="mt-4 text-xs text-[rgb(var(--ld-muted))]">
          Remedies shown will match your profile settings (home vs chemical).
        </div>
      </motion.section>

      <section className="ld-pop-card rounded-3xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow-soft)] sm:p-8">
        <div className="text-xl font-semibold tracking-tight">Results</div>
        <div className="mt-1 text-sm text-[rgb(var(--ld-muted))]">
          You’ll see likely issue, confidence, cures, and prevention steps.
        </div>

        {!result ? (
          <div className="mt-6 rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-5 text-sm text-[rgb(var(--ld-muted))]">
            Upload a leaf image and click <span className="font-semibold text-[rgb(var(--ld-text))]">Analyze leaf</span>.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 text-xs text-[rgb(var(--ld-muted))]">
                    Plant: <span className="font-semibold text-[rgb(var(--ld-text))]">{result.plantName}</span>
                    {typeof result.plantConfidence === 'number'
                      ? ` (${formatPct(result.plantConfidence)})`
                      : ''}
                  </div>
                  <div className="text-sm font-semibold">
                    {result.healthy ? 'Healthy leaf detected' : result.likelyIssue}
                  </div>
                  <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">{result.explanation}</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] px-3 py-1 text-xs">
                  {result.healthy ? (
                    <CheckCircle2 className="h-4 w-4 text-[rgb(var(--ld-green))]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[rgb(var(--ld-green-2))]" />
                  )}
                  Confidence {formatPct(result.confidence)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-5">
                <div className="text-sm font-semibold">Recommended cures</div>
                <div className="mt-2 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-[rgb(var(--ld-muted))]">Home remedies</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {result.remedies.home.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  {user?.wantsChemicals ? (
                    <div>
                      <div className="text-xs font-semibold text-[rgb(var(--ld-muted))]">Chemical / high-end</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {result.remedies.chemical.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] p-3 text-xs text-[rgb(var(--ld-muted))]">
                      Chemical options are hidden. Enable them in <span className="font-semibold">Profile</span> if needed.
                    </div>
                  )}
                </div>
              </div>

              <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-5">
                <div className="text-sm font-semibold">Prevention</div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {result.prevention.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] p-3 text-xs text-[rgb(var(--ld-muted))]">
                  For best accuracy: use sharp focus, avoid heavy shadows, and capture both sides of the leaf when possible.
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

