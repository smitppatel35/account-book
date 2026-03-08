'use client'

import { formatDistanceToNow } from 'date-fns'
import { useActivityLog } from '@/hooks/useActivityLog'
import { PlusCircle, Edit2, Trash2 } from 'lucide-react'

const icons = {
  create: <PlusCircle className="w-3.5 h-3.5 text-green-500" />,
  update: <Edit2 className="w-3.5 h-3.5 text-blue-500" />,
  delete: <Trash2 className="w-3.5 h-3.5 text-red-500" />,
}

const labels = { create: 'added', update: 'updated', delete: 'deleted' }

export function ActivityLog({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading } = useActivityLog(workspaceId)

  if (isLoading) return <div className="text-xs text-gray-400 p-4">Loading activity...</div>
  if (!data?.length) return <div className="text-xs text-gray-400 p-4">No activity yet</div>

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {data.map(log => (
        <div key={log.id} className="flex items-start gap-2 px-4 py-3">
          <span className="mt-0.5">{icons[log.action]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700">
              <span className="font-medium">{log.profiles?.full_name ?? log.profiles?.email ?? 'Someone'}</span>
              {' '}{labels[log.action]} an entry
              {log.snapshot && (log.snapshot as { amount?: number; description?: string }).description && (
                <span className="text-gray-500"> — {(log.snapshot as { description: string }).description}</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
