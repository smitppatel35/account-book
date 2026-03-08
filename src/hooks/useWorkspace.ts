'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, WorkspaceMember } from '@/types'

async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { supabase, session }
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { supabase, session } = await getSession()

      const { data, error } = await supabase
        .from('workspace_members')
        .select('role, joined_at, workspaces(*)')
        .eq('user_id', session.user.id)
        .order('joined_at', { ascending: false })

      if (error) throw error
      return data.map(d => ({ ...(d.workspaces as unknown as Workspace), role: d.role }))
    },
  })
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const { supabase } = await getSession()
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Workspace
    },
    enabled: !!id,
  })
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const { supabase } = await getSession()
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, profiles(id, email, full_name, avatar_url)')
        .eq('workspace_id', workspaceId)
      if (error) throw error
      return data as WorkspaceMember[]
    },
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const { supabase, session } = await getSession()

      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({ name, created_by: session.user.id })
        .select('id, name, created_by, invite_code, created_at')
        .single()
      if (error) throw error

      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: session.user.id,
        role: 'owner',
      })

      return workspace as Workspace
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}

export function useJoinWorkspace() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { supabase } = await getSession()

      const { data: workspaceId, error } = await supabase
        .rpc('join_workspace', { invite: inviteCode })
      if (error) throw error

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()
      if (wsError) throw wsError

      return workspace as Workspace
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}
