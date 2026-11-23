import { CheckCircle2, Clock, Download } from 'lucide-react'
import { exportCsv } from '../lib/storage'
import type { PourLog, ProjectSettings } from '../types/pour'

function Kpi({ label, value, sub, children }: { label: string; value: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="text-3xl font-extrabold">{value}</p>
      {sub && <p className="text-sm text-slate-600">{sub}</p>}
      {children}
    </div>
  )
}

export default function Dashboard({ logs, settings }: { logs: PourLog[]; settings: ProjectSettings }) {
  const passed = logs.filter((l) => l.status === 'PASS')
  const poured = passed.reduce((s, l) => s + l.cubicYards, 0)
  const pct = Math.min(100, (poured / (settings.targetCY || 1)) * 100)
  const passRate = logs.length ? Math.round((passed.length / logs.length) * 100) : 0
  const cyl = logs.reduce((s, l) => s + l.cylinders, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Poured / Target" value={`${poured % 1 ? poured.toFixed(1) : poured} / ${settings.targetCY} CY`}>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-blue-700" style={{ width: `${pct}%` }} />
          </div>
        </Kpi>
        <Kpi label="Pass Rate" value={`${passRate}%`} sub={`${passed.length} of ${logs.length} loads`} />
        <Kpi label="Total Trucks" value={String(logs.length)} />
        <Kpi label="Cylinders Cast" value={String(cyl)} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Live Feed</h2>
        <button
          onClick={() => {
            if (!exportCsv(logs, settings.projectName)) alert("No logs recorded today, so there's nothing to export.")
          }}
          className="flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-4 font-bold text-white">
          <Download size={20} /> Export Daily CSV Report
        </button>
      </div>

      <ul className="space-y-3">
        {logs.map((l) => (
          <li key={l.id} className="flex gap-3 rounded-xl bg-white p-3 shadow">
            {l.photo ? (
              <img src={l.photo} alt={`Ticket ${l.ticketNo}`} className="h-20 w-20 shrink-0 rounded-lg border object-cover" />
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">No photo</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold">{l.ticketNo}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-extrabold text-white ${l.status === 'PASS' ? 'bg-green-600' : 'bg-red-600'}`}>{l.status}</span>
                <span className="ml-auto" title={l.synced ? 'Synced' : 'Queued, not synced'}>
                  {l.synced ? <CheckCircle2 size={20} className="text-green-600" /> : <Clock size={20} className="text-amber-500" />}
                </span>
              </div>
              <p className="truncate text-sm font-semibold">{l.mixDesign} • {l.cubicYards} CY</p>
              <p className="text-sm">
                Slump {l.slumpIn}" • {l.tempF}°F • {l.cylinders} cyl
              </p>
              <p className="text-xs text-slate-600">{new Date(l.createdAt).toLocaleString()}</p>
              {l.notes && <p className="mt-1 text-sm italic text-slate-700">{l.notes}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
