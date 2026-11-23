import { useRef, useState } from 'react'
import { Camera, Check, Minus, Plus, TrafficCone, X } from 'lucide-react'
import { fileToThumbnail } from '../lib/storage'
import type { NewPourLog, PourStatus, ProjectSettings } from '../types/pour'

interface Props {
  settings: ProjectSettings
  online: boolean
  /** Ticket numbers already logged, used to warn about duplicates. */
  existingTickets: string[]
  onSubmit: (log: NewPourLog) => Promise<void>
}

function Caution({ children }: { children: React.ReactNode }) {
  return (
    <p className="-mt-2 flex items-start gap-2 border-2 border-asphalt bg-hazard px-3 py-2 font-display text-base font-extrabold uppercase tracking-wide text-asphalt">
      <TrafficCone size={20} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export default function LogForm({ settings, online, existingTickets, onSubmit }: Props) {
  const fresh = () => ({
    ticketNo: '', // typed in from the batch plant's delivery ticket
    mixDesign: settings.mixDesigns[0] ?? '',
    cubicYards: '10',
    slumpIn: 5.5,
    tempF: '74',
    cylinders: 2,
    status: 'PASS' as PourStatus,
    photo: null as string | null,
    notes: '',
  })
  const [f, setF] = useState(fresh)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof ReturnType<typeof fresh>>(k: K, v: ReturnType<typeof fresh>[K]) => setF((p) => ({ ...p, [k]: v }))
  const step = (d: number) => set('slumpIn', Math.max(0, Math.round((f.slumpIn + d) * 4) / 4))
  const tooHot = Number(f.tempF) > settings.maxTempF
  const ticketKey = f.ticketNo.trim().toLowerCase()
  const duplicateTicket = ticketKey !== '' && existingTickets.some((t) => t.trim().toLowerCase() === ticketKey)
  const mixes = settings.mixDesigns.includes(f.mixDesign) ? settings.mixDesigns : [f.mixDesign, ...settings.mixDesigns]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await onSubmit({
      ticketNo: f.ticketNo.trim(),
      mixDesign: f.mixDesign,
      cubicYards: Number(f.cubicYards) || 0,
      slumpIn: f.slumpIn,
      tempF: Number(f.tempF) || 0,
      cylinders: f.cylinders,
      status: f.status,
      photo: f.photo,
      notes: f.notes.trim(),
    })
    setBusy(false)
    setToast(online ? `${f.ticketNo} saved` : `${f.ticketNo} queued offline`)
    setTimeout(() => setToast(''), 3000)
    setF(fresh())
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form onSubmit={submit} className="plate space-y-5 p-4 pt-5">
      <h2 className="plate-title -ml-1 -mt-1">New Truck Ticket</h2>

      <label className="field block">
        <span>Truck Ticket #</span>
        <input
          required
          value={f.ticketNo}
          onChange={(e) => set('ticketNo', e.target.value)}
          placeholder="Copy from delivery ticket"
          className={`font-mono tracking-wider ${duplicateTicket ? '!border-cone !bg-hazard-light' : ''}`}
        />
      </label>
      {duplicateTicket && <Caution>Ticket {f.ticketNo.trim()} is already logged. Check for a duplicate before submitting.</Caution>}

      <label className="field block">
        <span>Mix Design</span>
        <select value={f.mixDesign} onChange={(e) => set('mixDesign', e.target.value)}>
          {mixes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="field block">
          <span>Cubic Yards</span>
          <input type="number" inputMode="decimal" min="0" step="0.5" required value={f.cubicYards} onChange={(e) => set('cubicYards', e.target.value)} />
        </label>
        <label className="field block">
          <span>Concrete Temp °F</span>
          <input
            type="number"
            inputMode="decimal"
            required
            value={f.tempF}
            onChange={(e) => set('tempF', e.target.value)}
            className={tooHot ? '!border-reject !bg-reject-light !text-reject-dark' : ''}
          />
        </label>
      </div>
      {tooHot && <Caution>Over max allowable temp ({settings.maxTempF}°F)</Caution>}

      <div className="field">
        <span className="mb-1 block font-display text-base font-extrabold uppercase tracking-widest">Slump (in)</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => step(-0.25)} className="btn btn-dark !w-16 shrink-0 !px-0" aria-label="Decrease slump">
            <Minus strokeWidth={3} />
          </button>
          <input type="number" inputMode="decimal" step="0.25" min="0" value={f.slumpIn} onChange={(e) => set('slumpIn', Number(e.target.value))} className="text-center font-mono !text-2xl" />
          <button type="button" onClick={() => step(0.25)} className="btn btn-dark !w-16 shrink-0 !px-0" aria-label="Increase slump">
            <Plus strokeWidth={3} />
          </button>
        </div>
      </div>

      <div>
        <span className="mb-1 block font-display text-base font-extrabold uppercase tracking-widest">Cylinders Cast</span>
        <div className="grid grid-cols-4 gap-2">
          {[0, 2, 4, 6].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => set('cylinders', n)}
              aria-pressed={f.cylinders === n}
              className={`btn !min-h-14 !text-3xl ${f.cylinders === n ? 'btn-hazard !shadow-none translate-x-0.5 translate-y-0.5' : 'btn-outline'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => set('status', 'PASS')}
          aria-pressed={f.status === 'PASS'}
          className={`btn !min-h-16 !text-3xl ${f.status === 'PASS' ? 'bg-pass text-white ring-4 ring-hazard' : 'bg-pass-light text-pass-dark'}`}
        >
          <Check size={30} strokeWidth={3.5} /> PASS
        </button>
        <button
          type="button"
          onClick={() => set('status', 'REJECT')}
          aria-pressed={f.status === 'REJECT'}
          className={`btn !min-h-16 !text-3xl ${f.status === 'REJECT' ? 'bg-reject text-white ring-4 ring-hazard' : 'bg-reject-light text-reject-dark'}`}
        >
          <X size={30} strokeWidth={3.5} /> REJECT
        </button>
      </div>

      <div>
        <span className="mb-1 block font-display text-base font-extrabold uppercase tracking-widest">Delivery Ticket Photo</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) set('photo', await fileToThumbnail(file))
          }}
        />
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline !border-dashed">
            <Camera /> {f.photo ? 'Retake' : 'Add Photo'}
          </button>
          {f.photo && <img src={f.photo} alt="Ticket preview" className="h-14 w-14 border-[3px] border-asphalt object-cover shadow-plate-sm" />}
        </div>
      </div>

      <label className="field block">
        <span>Notes</span>
        <input value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
      </label>

      <button disabled={busy} className="btn btn-hazard !min-h-16 w-full !text-2xl">
        {busy ? 'Saving…' : online ? 'Submit Log' : 'Save to Offline Queue'}
      </button>
      {toast && (
        <p role="status" className="border-[3px] border-asphalt bg-asphalt p-3 text-center font-display text-xl font-extrabold uppercase tracking-wider text-hazard">
          {toast}
        </p>
      )}
    </form>
  )
}
