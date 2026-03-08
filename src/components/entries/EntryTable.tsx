'use client'

import { Fragment, useState } from 'react'
import { format } from 'date-fns'
import { Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EntryForm } from './EntryForm'
import { useUpdateEntry, useDeleteEntry } from '@/hooks/useEntries'
import type { Entry } from '@/types'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n)
}

interface EntryTableProps {
  entries: Entry[]
  workspaceId: string
  currentUserId: string
  userRole: string
}

export function EntryTable({ entries, workspaceId, currentUserId, userRole }: EntryTableProps) {
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const update = useUpdateEntry(workspaceId)
  const del = useDeleteEntry(workspaceId)

  const canEdit = (entry: Entry) => entry.created_by === currentUserId || userRole === 'owner'

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg font-medium">No entries yet</p>
        <p className="text-sm mt-1">Add your first entry using the button above</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Mode</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Credit (₹)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Debit (₹)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">By</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map(entry => (
              <Fragment key={entry.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {format(new Date(entry.date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-900 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{entry.description}</span>
                      {entry.entry_links && entry.entry_links.length > 0 && (
                        <button
                          onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                          className="shrink-0 text-indigo-500 hover:text-indigo-700"
                        >
                          {expandedId === entry.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={entry.type}>{entry.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={entry.payment_mode}>{entry.payment_mode}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">
                    {entry.type === 'credit' ? fmt(entry.amount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-700">
                    {entry.type === 'debit' ? fmt(entry.amount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {entry.profiles?.full_name ?? entry.profiles?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit(entry) && (
                        <>
                          <button onClick={() => setEditEntry(entry)}
                            className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(entry.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === entry.id && entry.entry_links && entry.entry_links.length > 0 && (
                  <tr key={`${entry.id}-links`} className="bg-indigo-50">
                    <td colSpan={8} className="px-4 py-2">
                      <div className="flex flex-wrap gap-3">
                        {entry.entry_links.map(link => (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline">
                            <ExternalLink className="w-3 h-3" />
                            {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      <Modal open={!!editEntry} onClose={() => setEditEntry(null)} title="Edit Entry">
        {editEntry && (
          <EntryForm
            initial={editEntry}
            loading={update.isPending}
            onCancel={() => setEditEntry(null)}
            onSubmit={async ({ links, ...data }) => {
              await update.mutateAsync({
                id: editEntry.id,
                ...data,
                links: links.map((l, i) => ({ id: '', entry_id: editEntry.id, url: l.url, label: l.label, order: i })),
              })
              setEditEntry(null)
            }}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Entry">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this entry? This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
          <Button variant="danger" loading={del.isPending} className="flex-1"
            onClick={async () => { if (deleteId) { await del.mutateAsync(deleteId); setDeleteId(null) } }}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
