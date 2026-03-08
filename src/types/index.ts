export type EntryType = 'credit' | 'debit'
export type PaymentMode = 'cash' | 'online'
export type WorkspaceRole = 'owner' | 'editor' | 'viewer'

export interface Workspace {
  id: string
  name: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  joined_at: string
  profiles?: Profile
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface EntryLink {
  id: string
  entry_id: string
  url: string
  label: string | null
  order: number
}

export interface Entry {
  id: string
  workspace_id: string
  type: EntryType
  amount: number
  payment_mode: PaymentMode
  description: string
  date: string
  created_by: string
  created_at: string
  updated_at: string
  entry_links?: EntryLink[]
  profiles?: Profile
}

export interface ActivityLog {
  id: string
  workspace_id: string
  entry_id: string | null
  user_id: string
  action: 'create' | 'update' | 'delete'
  snapshot: Record<string, unknown>
  created_at: string
  profiles?: Profile
}

export interface WorkspaceSummary {
  totalCredit: number
  totalDebit: number
  balance: number
  creditCash: number
  creditOnline: number
  debitCash: number
  debitOnline: number
}
