import { HardHat, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface Props {
  projectName: string
  online: boolean
  queued: number
  simOffline: boolean
  syncing: boolean
  mock: boolean
  onToggleSim: () => void
  onSync: () => void
}

export default function Header({ projectName, online, queued, simOffline, syncing, mock, onToggleSim, onSync }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-asphalt text-white shadow-lg">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center border-[3px] border-white bg-hazard text-asphalt shadow-[3px_3px_0_0_#ff6a13]">
              <HardHat size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wider text-hazard">FieldPour Logger</h1>
              <p className="mt-1 truncate font-display text-base font-bold uppercase tracking-widest text-concrete">{projectName}</p>
            </div>
          </div>
          <label className="flex shrink-0 cursor-pointer flex-col items-end gap-1 font-display text-sm font-bold uppercase tracking-widest text-concrete">
            Simulate Offline
            <button
              type="button"
              role="switch"
              aria-checked={simOffline}
              onClick={onToggleSim}
              className={`relative h-8 w-14 border-2 border-white transition ${simOffline ? 'bg-cone' : 'bg-asphalt-mid'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 border-2 border-asphalt bg-hazard transition-all ${simOffline ? 'left-7' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-display text-base font-extrabold uppercase tracking-wider ${
              online ? 'border-pass-light bg-pass text-white' : 'border-asphalt bg-hazard text-asphalt'
            }`}
          >
            {online ? <Wifi size={18} /> : <WifiOff size={18} />}
            {online ? (queued ? `Online • ${queued} Pending` : 'Online • Synced') : `Offline • ${queued} Log${queued === 1 ? '' : 's'} Queued`}
          </span>
          <button onClick={onSync} disabled={!online || syncing} className="btn btn-hazard !min-h-10 !border-2 !px-3 !text-base">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> Sync Now
          </button>
          <span className="ml-auto font-mono text-xs uppercase tracking-wider text-concrete-dark">{mock ? 'Local mock mode' : 'Supabase connected'}</span>
        </div>
      </div>
      <div className="hazard-stripe h-3 border-y-2 border-asphalt" aria-hidden />
    </header>
  )
}
