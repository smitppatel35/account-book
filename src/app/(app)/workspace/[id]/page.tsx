'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Download, Users, Activity, BookOpen } from 'lucide-react'
import { useWorkspace, useWorkspaceMembers } from '@/hooks/useWorkspace'
import { useEntries, useSummary, useCreateEntry } from '@/hooks/useEntries'
import { useRealtimeEntries } from '@/hooks/useRealtime'
import { SummaryBar } from '@/components/entries/SummaryBar'
import { EntryTable } from '@/components/entries/EntryTable'
import { EntryFilters } from '@/components/entries/EntryFilters'
import { EntryForm } from '@/components/entries/EntryForm'
import { ActivityLog } from '@/components/workspace/ActivityLog'
import { InvitePanel } from '@/components/workspace/InvitePanel'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface Filters {
  type: '' | 'credit' | 'debit'
  paymentMode: '' | 'cash' | 'online'
  dateFrom: string
  dateTo: string
}

function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { session } } = await createClient().auth.getSession()
      return session?.user ?? null
    },
  })
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: workspace, isLoading: wsLoading } = useWorkspace(id)
  const { data: members } = useWorkspaceMembers(id)
  const { data: currentUser } = useCurrentUser()

  const [filters, setFilters] = useState<Filters>({ type: '', paymentMode: '', dateFrom: '', dateTo: '' })
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const { data: entries, isLoading: entriesLoading } = useEntries(id, {
    type: filters.type || undefined,
    paymentMode: filters.paymentMode || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  })

  useRealtimeEntries(id)

  const summary = useSummary(entries)
  const createEntry = useCreateEntry(id)

  const userRole = members?.find(m => m.user_id === currentUser?.id)?.role ?? 'viewer'
  const canEdit = userRole === 'owner' || userRole === 'editor'

  const exportCSV = () => {
    if (!entries) return
    const headers = ['Date', 'Description', 'Type', 'Payment Mode', 'Credit', 'Debit', 'Added By']
    const rows = entries.map(e => [
      e.date, e.description, e.type, e.payment_mode,
      e.type === 'credit' ? e.amount : '',
      e.type === 'debit' ? e.amount : '',
      e.profiles?.full_name ?? e.profiles?.email ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${workspace?.name ?? 'ledger'}.csv`
    a.click()
  }

  if (wsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading workspace...</div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Workspace not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => router.push('/dashboard')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-900 truncate">{workspace.name}</h1>
              <p className="text-xs text-gray-400">{members?.length ?? 0} member{members?.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowActivity(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Activity">
              <Activity className="w-4 h-4" />
            </button>
            <button onClick={() => setShowInvite(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Members">
              <Users className="w-4 h-4" />
            </button>
            <button onClick={exportCSV}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Export CSV">
              <Download className="w-4 h-4" />
            </button>
            {canEdit && (
              <Button size="sm" onClick={() => setShowAddEntry(true)}>
                <Plus className="w-4 h-4" /><span className="hidden sm:inline ml-1">Add Entry</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Summary */}
        <SummaryBar summary={summary} />

        {/* Filters + table */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col gap-0">
          <div className="px-5 py-4 border-b border-gray-100">
            <EntryFilters filters={filters} onChange={setFilters} />
          </div>
          <div className="p-0">
            {entriesLoading ? (
              <div className="py-12 text-center text-gray-400 animate-pulse">Loading entries...</div>
            ) : (
              <EntryTable
                entries={entries ?? []}
                workspaceId={id}
                currentUserId={currentUser?.id ?? ''}
                userRole={userRole}
              />
            )}
          </div>
        </div>
      </main>

      {/* Add entry modal */}
      <Modal open={showAddEntry} onClose={() => setShowAddEntry(false)} title="Add Entry">
        <EntryForm
          loading={createEntry.isPending}
          onCancel={() => setShowAddEntry(false)}
          onSubmit={async (data) => {
            await createEntry.mutateAsync(data)
            setShowAddEntry(false)
          }}
        />
      </Modal>

      {/* Activity modal */}
      <Modal open={showActivity} onClose={() => setShowActivity(false)} title="Activity Log">
        <ActivityLog workspaceId={id} />
      </Modal>

      {/* Members / Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Members & Invite">
        <InvitePanel workspaceId={id} inviteCode={workspace.invite_code} />
      </Modal>
    </div>
  )
}
