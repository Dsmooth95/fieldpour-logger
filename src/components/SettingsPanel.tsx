import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ProjectSettings } from '../types/pour'

export default function SettingsPanel({ settings, onSave }: { settings: ProjectSettings; onSave: (s: ProjectSettings) => void }) {
  const [s, setS] = useState(settings)
  const [saved, setSaved] = useState(false)
  const setMix = (i: number, v: string) => setS({ ...s, mixDesigns: s.mixDesigns.map((m, j) => (j === i ? v : m)) })

  return (
    <form
      className="plate space-y-5 p-4 pt-5"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ ...s, mixDesigns: s.mixDesigns.map((m) => m.trim()).filter(Boolean) })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }}
    >
      <h2 className="plate-title -ml-1 -mt-1">Job Site Setup</h2>

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
        <span className="mb-1 block font-display text-base font-extrabold uppercase tracking-widest">Mix Designs</span>
        <div className="space-y-2">
          {s.mixDesigns.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input value={m} onChange={(e) => setMix(i, e.target.value)} />
              <button type="button" aria-label="Remove mix" onClick={() => setS({ ...s, mixDesigns: s.mixDesigns.filter((_, j) => j !== i) })} className="btn !w-14 shrink-0 !px-0 bg-reject-light text-reject-dark">
                <Trash2 />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setS({ ...s, mixDesigns: [...s.mixDesigns, ''] })} className="btn btn-outline mt-2 !border-dashed">
          <Plus /> Add Mix Design
        </button>
      </div>

      <button className="btn btn-hazard !min-h-16 w-full !text-2xl">Save Settings</button>
      {saved && (
        <p role="status" className="border-[3px] border-asphalt bg-asphalt p-3 text-center font-display text-xl font-extrabold uppercase tracking-wider text-hazard">
          Settings saved
        </p>
      )}
    </form>
  )
}
