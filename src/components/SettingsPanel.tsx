import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ProjectSettings } from '../types/pour'

export default function SettingsPanel({ settings, onSave }: { settings: ProjectSettings; onSave: (s: ProjectSettings) => void }) {
  const [s, setS] = useState(settings)
  const [saved, setSaved] = useState(false)
  const setMix = (i: number, v: string) => setS({ ...s, mixDesigns: s.mixDesigns.map((m, j) => (j === i ? v : m)) })

  return (
    <form
      className="space-y-5 rounded-xl bg-white p-4 shadow"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ ...s, mixDesigns: s.mixDesigns.map((m) => m.trim()).filter(Boolean) })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }}
    >
      <label className="field block">
        <span>Project Name</span>
        <input required value={s.projectName} onChange={(e) => setS({ ...s, projectName: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field block">
          <span>Target Cubic Yards</span>
          <input type="number" inputMode="decimal" min="1" required value={s.targetCY} onChange={(e) => setS({ ...s, targetCY: Number(e.target.value) })} />
        </label>
        <label className="field block">
          <span>Max Temp °F</span>
          <input type="number" inputMode="decimal" required value={s.maxTempF} onChange={(e) => setS({ ...s, maxTempF: Number(e.target.value) })} />
        </label>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold uppercase tracking-wide text-slate-700">Mix Designs</span>
        <div className="space-y-2">
          {s.mixDesigns.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input value={m} onChange={(e) => setMix(i, e.target.value)} />
              <button type="button" aria-label="Remove mix" onClick={() => setS({ ...s, mixDesigns: s.mixDesigns.filter((_, j) => j !== i) })} className="grid min-h-12 w-14 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700">
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setS({ ...s, mixDesigns: [...s.mixDesigns, ''] })} className="mt-2 flex min-h-12 items-center gap-2 rounded-lg border-2 border-slate-500 px-4 font-bold">
          <Plus /> Add Mix Design
        </button>
      </div>

      <button className="min-h-14 w-full rounded-xl bg-blue-700 text-xl font-extrabold text-white">Save Settings</button>
      {saved && <p role="status" className="rounded-lg bg-slate-900 p-3 text-center font-bold text-white">Settings saved</p>}
    </form>
  )
}
