import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

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
    <header className="sticky top-0 z-10 bg-slate-900 text-white shadow-lg">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight">FieldPour Logger</h1>
            <p className="truncate text-sm font-semibold text-amber-300">{projectName}</p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-bold">
            Simulate Offline
            <button
              type="button"
              role="switch"
              aria-checked={simOffline}
              onClick={onToggleSim}
              className={`relative h-7 w-12 rounded-full transition ${simOffline ? 'bg-amber-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${simOffline ? 'left-5' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
              online ? 'bg-green-600 text-white' : 'bg-amber-400 text-slate-900'
            }`}
          >
            {online ? <Wifi size={16} /> : <WifiOff size={16} />}
            {online ? (queued ? `Online • ${queued} Pending` : 'Online • Synced') : `Offline • ${queued} Log${queued === 1 ? '' : 's'} Queued`}
          </span>
          <button
            onClick={onSync}
            disabled={!online || syncing}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-bold disabled:opacity-40"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> Sync Now
          </button>
          <span className="ml-auto text-xs text-slate-400">{mock ? 'Local mock mode' : 'Supabase connected'}</span>
        </div>
      </div>
    </header>
  )
}
