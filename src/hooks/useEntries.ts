'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Entry, EntryLink, WorkspaceSummary } from '@/types'

async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { supabase, session }
}

export function useEntries(workspaceId: string, filters?: {
  type?: 'credit' | 'debit'
  paymentMode?: 'cash' | 'online'
  dateFrom?: string
  dateTo?: string
  userId?: string
}) {
  return useQuery({
    queryKey: ['entries', workspaceId, filters],
    queryFn: async () => {
      const { supabase } = await getSession()
      let query = supabase
        .from('entries')
        .select(`*, profiles(id, email, full_name), entry_links(*)`)
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.type) query = query.eq('type', filters.type)
      if (filters?.paymentMode) query = query.eq('payment_mode', filters.paymentMode)
      if (filters?.dateFrom) query = query.gte('date', filters.dateFrom)
      if (filters?.dateTo) query = query.lte('date', filters.dateTo)
      if (filters?.userId) query = query.eq('created_by', filters.userId)

      const { data, error } = await query
      if (error) throw error
      return data as Entry[]
    },
    enabled: !!workspaceId,
  })
}

export function useSummary(entries: Entry[] | undefined): WorkspaceSummary {
  if (!entries) return { totalCredit: 0, totalDebit: 0, balance: 0, creditCash: 0, creditOnline: 0, debitCash: 0, debitOnline: 0 }

  return entries.reduce((acc, entry) => {
    const amount = Number(entry.amount)
    if (entry.type === 'credit') {
      acc.totalCredit += amount
      if (entry.payment_mode === 'cash') acc.creditCash += amount
      else acc.creditOnline += amount
    } else {
      acc.totalDebit += amount
      if (entry.payment_mode === 'cash') acc.debitCash += amount
      else acc.debitOnline += amount
    }
    acc.balance = acc.totalCredit - acc.totalDebit
    return acc
  }, { totalCredit: 0, totalDebit: 0, balance: 0, creditCash: 0, creditOnline: 0, debitCash: 0, debitOnline: 0 })
}

export interface EntryInput {
  type: 'credit' | 'debit'
  amount: number
  payment_mode: 'cash' | 'online'
  description: string
  date: string
  links?: { url: string; label: string }[]
}

export function useCreateEntry(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ links, ...entry }: EntryInput) => {
      const { supabase, session } = await getSession()

      const { data, error } = await supabase
        .from('entries')
        .insert({ ...entry, workspace_id: workspaceId, created_by: session.user.id })
        .select()
        .single()
      if (error) throw error

      if (links && links.length > 0) {
        const linkRows = links.map((l, i) => ({ entry_id: data.id, url: l.url, label: l.label, order: i }))
        await supabase.from('entry_links').insert(linkRows)
      }

      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        entry_id: data.id,
        user_id: session.user.id,
        action: 'create',
        snapshot: data,
      })

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entries', workspaceId] }),
  })
}

export function useUpdateEntry(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, links, ...entry }: Partial<EntryInput> & { id: string; links?: EntryLink[] }) => {
      const { supabase, session } = await getSession()

      const { data, error } = await supabase
        .from('entries')
        .update(entry)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      if (links !== undefined) {
        await supabase.from('entry_links').delete().eq('entry_id', id)
        if (links.length > 0) {
          const linkRows = links.map((l, i) => ({ entry_id: id, url: l.url, label: l.label, order: i }))
          await supabase.from('entry_links').insert(linkRows)
        }
      }

      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        entry_id: id,
        user_id: session.user.id,
        action: 'update',
        snapshot: data,
      })

      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entries', workspaceId] }),
  })
}

export function useDeleteEntry(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { supabase, session } = await getSession()

      const { data: entry } = await supabase.from('entries').select().eq('id', entryId).single()

      const { error } = await supabase.from('entries').delete().eq('id', entryId)
      if (error) throw error

      await supabase.from('activity_log').insert({
        workspace_id: workspaceId,
        entry_id: null,
        user_id: session.user.id,
        action: 'delete',
        snapshot: entry,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entries', workspaceId] }),
  })
}
