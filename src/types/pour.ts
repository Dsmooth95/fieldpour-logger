export type PourStatus = 'PASS' | 'REJECT'

export interface PourLog {
  id: string
  ticketNo: string
  mixDesign: string
  cubicYards: number
  slumpIn: number
  tempF: number
  cylinders: number
  status: PourStatus
  /** base64 thumbnail while queued, public URL once uploaded */
  photo: string | null
  notes: string
  createdAt: string
  synced: boolean
}

export type NewPourLog = Omit<PourLog, 'id' | 'createdAt' | 'synced'>

export interface ProjectSettings {
  projectName: string
  targetCY: number
  maxTempF: number
  mixDesigns: string[]
}

export type Tab = 'log' | 'dashboard' | 'settings'
