import { CheckCircle2, Clock, Download } from 'lucide-react'
import { exportCsv } from '../lib/storage'
import type { PourLog, ProjectSettings } from '../types/pour'

function Kpi({ label, value, sub, children }: { label: string; value: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="border-[3px] border-asphalt bg-asphalt p-3 shadow-plate">
      <p className="inline-block bg-hazard px-2 font-display text-sm font-extrabold uppercase tracking-widest text-asphalt">{label}</p>
      <p className="mt-1 whitespace-nowrap font-display text-3xl font-extrabold uppercase leading-tight tracking-wide text-white sm:text-4xl">{value}</p>
      {sub && <p className="font-mono text-sm uppercase tracking-wider text-concrete-dark">{sub}</p>}
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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Poured / Target" value={`${poured % 1 ? poured.toFixed(1) : poured} / ${settings.targetCY} CY`}>
          <div className="mt-2 h-4 border-2 border-white bg-asphalt-mid" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Poured volume vs target">
            <div className="progress-stripes h-full" style={{ width: `${pct}%` }} />
          </div>
        </Kpi>
        <Kpi label="Pass Rate" value={`${passRate}%`} sub={`${passed.length} of ${logs.length} loads`} />
        <Kpi label="Total Trucks" value={String(logs.length)} />
        <Kpi label="Cylinders Cast" value={String(cyl)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="plate-title whitespace-nowrap !text-xl">Live Feed</h2>
        <button
          onClick={() => {
            if (!exportCsv(logs, settings.projectName)) alert("No logs recorded today, so there's nothing to export.")
          }}
          className="btn btn-dark w-full sm:w-auto"
        >
          <Download size={20} strokeWidth={2.5} /> Export Daily CSV Report
        </button>
      </div>

      <ul className="space-y-3">
        {logs.map((l) => {
          const pass = l.status === 'PASS'
          return (
            <li key={l.id} className={`flex gap-3 border-[3px] border-l-[10px] border-asphalt bg-concrete-light p-3 shadow-plate-sm ${pass ? '!border-l-pass' : '!border-l-reject'}`}>
              {l.photo ? (
                <img src={l.photo} alt={`Ticket ${l.ticketNo}`} className="h-20 w-20 shrink-0 border-2 border-asphalt object-cover" />
              ) : (
                <div className="grid h-20 w-20 shrink-0 place-items-center border-2 border-dashed border-asphalt-mid bg-concrete font-display text-sm font-bold uppercase tracking-wider text-asphalt-mid">No photo</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xl font-bold tracking-wider">{l.ticketNo}</span>
                  <span className={`px-2 py-0.5 font-display text-sm font-extrabold uppercase tracking-widest text-white ${pass ? 'bg-pass' : 'bg-reject'}`}>{l.status}</span>
                  <span className="ml-auto" title={l.synced ? 'Synced' : 'Queued, not synced'}>
                    {l.synced ? <CheckCircle2 size={22} className="text-pass" strokeWidth={2.5} /> : <Clock size={22} className="text-cone" strokeWidth={2.5} />}
                  </span>
                </div>
                <p className="truncate font-display text-lg font-bold uppercase tracking-wide">
                  {l.mixDesign} • {l.cubicYards} CY
                </p>
                <p className="font-mono text-sm">
                  Slump {l.slumpIn}" • {l.tempF}°F • {l.cylinders} cyl
                </p>
                <p className="font-mono text-xs text-asphalt-mid">{new Date(l.createdAt).toLocaleString()}</p>
                {l.notes && <p className="mt-1 border-t-2 border-dashed border-asphalt-mid/40 pt-1 text-sm italic text-asphalt-soft">{l.notes}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
