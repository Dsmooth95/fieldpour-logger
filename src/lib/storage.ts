import { createClient } from '@supabase/supabase-js'
import type { NewPourLog, PourLog, ProjectSettings } from '../types/pour'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const client = url && key ? createClient(url, key) : null

/** True when .env keys are missing and everything lives in localStorage. */
export const isMockMode = client === null

const LOGS_KEY = 'fp_logs'
const SETTINGS_KEY = 'fp_settings'

export const DEFAULT_SETTINGS: ProjectSettings = {
  projectName: 'I-405 Bridge Pier 4 Pour',
  targetCY: 200,
  maxTempF: 90,
  mixDesigns: ['4000 PSI Structural', '5000 PSI Bridge Deck', '3000 PSI Lean Fill'],
}

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString()

const SEED_LOGS: PourLog[] = [
  { id: 'seed-1', ticketNo: 'TK-101', mixDesign: '5000 PSI Bridge Deck', cubicYards: 10, slumpIn: 4.5, tempF: 72, cylinders: 4, status: 'PASS', photo: null, notes: 'First truck of the day, clean discharge.', createdAt: ago(240), synced: true },
  { id: 'seed-2', ticketNo: 'TK-102', mixDesign: '5000 PSI Bridge Deck', cubicYards: 10, slumpIn: 5.0, tempF: 75, cylinders: 2, status: 'PASS', photo: null, notes: '', createdAt: ago(185), synced: true },
  { id: 'seed-3', ticketNo: 'TK-103', mixDesign: '4000 PSI Structural', cubicYards: 10, slumpIn: 8.0, tempF: 93, cylinders: 0, status: 'REJECT', photo: null, notes: 'Slump 8.0" and temp 93°F over limits. Sent back to plant.', createdAt: ago(130), synced: true },
  { id: 'seed-4', ticketNo: 'TK-104', mixDesign: '4000 PSI Structural', cubicYards: 9.5, slumpIn: 5.5, tempF: 74, cylinders: 2, status: 'PASS', photo: null, notes: 'Replacement load for TK-103.', createdAt: ago(60), synced: true },
]

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const loadSettings = (): ProjectSettings => ({ ...DEFAULT_SETTINGS, ...read<ProjectSettings>(SETTINGS_KEY) })
export const saveSettings = (s: ProjectSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))

/** Local copy of all logs (also the mock DB). Seeds on first load. */
export function loadLogs(): PourLog[] {
  const stored = read<PourLog[]>(LOGS_KEY)
  if (stored) return stored
  localStorage.setItem(LOGS_KEY, JSON.stringify(SEED_LOGS))
  return SEED_LOGS
}

const persist = (logs: PourLog[]) => {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
  } catch {
    // quota exceeded; keep in-memory state only
  }
}

export const queuedCount = (logs: PourLog[]) => logs.filter((l) => !l.synced).length

/** Save a log locally as unsynced, then try to sync if online. */
export async function addLog(input: NewPourLog, logs: PourLog[], online: boolean, projectName: string): Promise<PourLog[]> {
  const log: PourLog = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), synced: false }
  const next = [log, ...logs]
  persist(next)
  return online ? syncAll(next, projectName) : next
}

const dataUrlToBlob = async (d: string) => (await fetch(d)).blob()

async function pushToSupabase(log: PourLog, projectName: string): Promise<string | null> {
  if (!client) return log.photo
  let photo = log.photo
  if (photo?.startsWith('data:')) {
    const path = `${log.id}.jpg`
    const { error } = await client.storage.from('tickets').upload(path, await dataUrlToBlob(photo), { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    photo = client.storage.from('tickets').getPublicUrl(path).data.publicUrl
  }
  const { error } = await client.from('pour_logs').upsert({
    id: log.id,
    ticket_no: log.ticketNo,
    mix_design: log.mixDesign,
    cubic_yards: log.cubicYards,
    slump_in: log.slumpIn,
    temp_f: log.tempF,
    cylinders: log.cylinders,
    status: log.status,
    photo_url: photo,
    notes: log.notes,
    project_name: projectName,
    created_at: log.createdAt,
  })
  if (error) throw error
  return photo
}

/** Push every queued log. Failures stay queued for the next attempt. */
export async function syncAll(logs: PourLog[], projectName: string): Promise<PourLog[]> {
  const out: PourLog[] = []
  for (const log of logs) {
    if (log.synced) {
      out.push(log)
      continue
    }
    try {
      const photo = await pushToSupabase(log, projectName)
      out.push({ ...log, photo, synced: true })
    } catch (e) {
      console.warn('Sync failed, keeping queued', e)
      out.push(log)
    }
  }
  persist(out)
  return out
}

/** Supabase mode only: merge remote rows with local queued logs. */
export async function refreshFromRemote(logs: PourLog[]): Promise<PourLog[]> {
  if (!client) return logs
  const { data, error } = await client.from('pour_logs').select('*').order('created_at', { ascending: false })
  if (error || !data) return logs
  const remote: PourLog[] = data.map((r) => ({
    id: r.id, ticketNo: r.ticket_no, mixDesign: r.mix_design, cubicYards: Number(r.cubic_yards),
    slumpIn: Number(r.slump_in), tempF: Number(r.temp_f), cylinders: r.cylinders, status: r.status,
    photo: r.photo_url, notes: r.notes ?? '', createdAt: r.created_at, synced: true,
  }))
  const queued = logs.filter((l) => !l.synced)
  const base = remote.length ? remote : logs.filter((l) => l.synced) // keep seed demo data if DB is empty
  const merged = [...queued, ...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  persist(merged)
  return merged
}

/** Resize an image file to a small JPEG data URL for the offline queue. */
export function fileToThumbnail(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(objUrl)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objUrl)
      reject(new Error('Could not read image'))
    }
    img.src = objUrl
  })
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

/** Export today's logs (local time) as CSV. Returns the number of rows exported. */
export function exportCsv(logs: PourLog[], projectName: string): number {
  const today = new Date().toDateString()
  const todays = logs.filter((l) => new Date(l.createdAt).toDateString() === today)
  if (!todays.length) return 0
  const head = ['Ticket', 'Time', 'Mix Design', 'Cubic Yards', 'Slump (in)', 'Temp (F)', 'Cylinders', 'Status', 'Synced', 'Notes']
  const rows = [...todays].reverse().map((l) =>
    [l.ticketNo, new Date(l.createdAt).toLocaleString(), l.mixDesign, l.cubicYards, l.slumpIn, l.tempF, l.cylinders, l.status, l.synced ? 'Yes' : 'No', l.notes].map(csvCell).join(','),
  )
  const csv = [head.map(csvCell).join(','), ...rows].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${projectName.replace(/[^\w-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  return todays.length
}
