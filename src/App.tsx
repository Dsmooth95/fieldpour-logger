import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardList, LayoutDashboard, Settings } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import LogForm from './components/LogForm'
import SettingsPanel from './components/SettingsPanel'
import { addLog, isMockMode, loadLogs, loadSettings, queuedCount, refreshFromRemote, saveSettings, syncAll } from './lib/storage'
import type { NewPourLog, PourLog, ProjectSettings, Tab } from './types/pour'

const TABS: { id: Tab; label: string; Icon: typeof Settings }[] = [
  { id: 'log', label: 'Log Entry', Icon: ClipboardList },
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('log')
  const [settings, setSettings] = useState<ProjectSettings>(loadSettings)
  const [logs, setLogs] = useState<PourLog[]>(loadLogs)
  const [netOnline, setNetOnline] = useState(navigator.onLine)
  const [simOffline, setSimOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const busy = useRef(false)
  const logsRef = useRef(logs)
  logsRef.current = logs

  const online = netOnline && !simOffline
  const queued = queuedCount(logs)

  useEffect(() => {
    const on = () => setNetOnline(true)
    const off = () => setNetOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const sync = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setSyncing(true)
    try {
      const pushed = await syncAll(logsRef.current, settings.projectName)
      setLogs(await refreshFromRemote(pushed))
    } finally {
      busy.current = false
      setSyncing(false)
    }
  }, [settings.projectName])

  // Auto-sync on reconnect (and once on load when online).
  useEffect(() => {
    if (online) void sync()
  }, [online, sync])

  async function handleSubmit(input: NewPourLog) {
    setLogs(await addLog(input, logs, online, settings.projectName))
  }

  function handleSaveSettings(s: ProjectSettings) {
    saveSettings(s)
    setSettings(s)
  }

  return (
    <div className="min-h-screen pb-24">
      <Header
        projectName={settings.projectName}
        online={online}
        queued={queued}
        simOffline={simOffline}
        syncing={syncing}
        mock={isMockMode}
        onToggleSim={() => setSimOffline((v) => !v)}
        onSync={sync}
      />
      <main className="mx-auto max-w-5xl p-4">
        {tab === 'log' && (
          <div className="mx-auto max-w-xl">
            <LogForm settings={settings} online={online} existingTickets={logs.map((l) => l.ticketNo)} onSubmit={handleSubmit} />
          </div>
        )}
        {tab === 'dashboard' && <Dashboard logs={logs} settings={settings} />}
        {tab === 'settings' && (
          <div className="mx-auto max-w-xl">
            <SettingsPanel settings={settings} onSave={handleSaveSettings} />
          </div>
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t-2 border-slate-900 bg-white">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-bold ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-800'}`}
          >
            <Icon size={24} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
