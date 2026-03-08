'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeEntries(workspaceId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!workspaceId) return

    const channel = createClient()
      .channel(`entries:${workspaceId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'entries',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['entries', workspaceId] })
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_log',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ['activity', workspaceId] })
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [workspaceId, qc])
}
