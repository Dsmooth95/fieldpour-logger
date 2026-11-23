import { useRef, useState } from 'react'
import { Camera, Check, Minus, Plus, X } from 'lucide-react'
import { fileToThumbnail } from '../lib/storage'
import type { NewPourLog, PourStatus, ProjectSettings } from '../types/pour'

interface Props {
  settings: ProjectSettings
  online: boolean
  /** Ticket numbers already logged, used to warn about duplicates. */
  existingTickets: string[]
  onSubmit: (log: NewPourLog) => Promise<void>
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
    <form onSubmit={submit} className="space-y-5 rounded-xl bg-white p-4 shadow">
      <label className="field block">
        <span>Truck Ticket #</span>
        <input
          required
          value={f.ticketNo}
          onChange={(e) => set('ticketNo', e.target.value)}
          placeholder="Copy from delivery ticket"
          className={duplicateTicket ? '!border-amber-500 !bg-amber-50' : ''}
        />
      </label>
      {duplicateTicket && <p className="-mt-3 text-sm font-bold text-amber-700">Ticket {f.ticketNo.trim()} is already logged. Check for a duplicate before submitting.</p>}

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
            className={tooHot ? '!border-red-600 !bg-red-50' : ''}
          />
        </label>
      </div>
      {tooHot && <p className="-mt-3 text-sm font-bold text-red-700">Over max allowable temp ({settings.maxTempF}°F)</p>}

      <div className="field">
        <span className="mb-1 block text-sm font-bold uppercase tracking-wide text-slate-700">Slump (in)</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => step(-0.25)} className="grid min-h-12 w-16 place-items-center rounded-lg bg-slate-800 text-white active:bg-slate-600" aria-label="Decrease slump">
            <Minus />
          </button>
          <input type="number" inputMode="decimal" step="0.25" min="0" value={f.slumpIn} onChange={(e) => set('slumpIn', Number(e.target.value))} className="text-center font-bold" />
          <button type="button" onClick={() => step(0.25)} className="grid min-h-12 w-16 place-items-center rounded-lg bg-slate-800 text-white active:bg-slate-600" aria-label="Increase slump">
            <Plus />
          </button>
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold uppercase tracking-wide text-slate-700">Cylinders Cast</span>
        <div className="grid grid-cols-4 gap-2">
          {[0, 2, 4, 6].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => set('cylinders', n)}
              className={`min-h-12 rounded-full border-2 text-lg font-bold ${f.cylinders === n ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-400 bg-white'}`}
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
          className={`flex min-h-16 items-center justify-center gap-2 rounded-xl text-2xl font-extrabold ${f.status === 'PASS' ? 'bg-green-600 text-white ring-4 ring-green-300' : 'bg-green-100 text-green-800'}`}
        >
          <Check size={28} /> PASS
        </button>
        <button
          type="button"
          onClick={() => set('status', 'REJECT')}
          className={`flex min-h-16 items-center justify-center gap-2 rounded-xl text-2xl font-extrabold ${f.status === 'REJECT' ? 'bg-red-600 text-white ring-4 ring-red-300' : 'bg-red-100 text-red-800'}`}
        >
          <X size={28} /> REJECT
        </button>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold uppercase tracking-wide text-slate-700">Delivery Ticket Photo</span>
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
          <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-12 items-center gap-2 rounded-lg border-2 border-dashed border-slate-500 px-4 font-bold">
            <Camera /> {f.photo ? 'Retake' : 'Add Photo'}
          </button>
          {f.photo && <img src={f.photo} alt="Ticket preview" className="h-14 w-14 rounded-lg border object-cover" />}
        </div>
      </div>

      <label className="field block">
        <span>Notes</span>
        <input value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
      </label>

      <button disabled={busy} className="min-h-14 w-full rounded-xl bg-blue-700 text-xl font-extrabold text-white active:bg-blue-900 disabled:opacity-50">
        {busy ? 'Saving…' : online ? 'Submit Log' : 'Save to Offline Queue'}
      </button>
      {toast && <p role="status" className="rounded-lg bg-slate-900 p-3 text-center font-bold text-white">{toast}</p>}
    </form>
  )
}
