'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog } from '@/types'

export function useActivityLog(workspaceId: string) {
  return useQuery({
    queryKey: ['activity', workspaceId],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('activity_log')
        .select('*, profiles(id, email, full_name)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as ActivityLog[]
    },
    enabled: !!workspaceId,
  })
}
