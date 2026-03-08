'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, LogOut, Link as LinkIcon } from 'lucide-react'
import { useWorkspaces, useCreateWorkspace, useJoinWorkspace } from '@/hooks/useWorkspace'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function DashboardPage() {
  const router = useRouter()
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWs = useCreateWorkspace()
  const joinWs = useJoinWorkspace()

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [wsName, setWsName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [createError, setCreateError] = useState('')
  const [joinError, setJoinError] = useState('')

  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wsName.trim()) return
    try {
      const ws = await createWs.mutateAsync(wsName.trim())
      setShowCreate(false)
      setWsName('')
      router.push(`/workspace/${ws.id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create')
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    try {
      const code = inviteCode.trim().split('/').pop() ?? inviteCode.trim()
      const ws = await joinWs.mutateAsync(code)
      setShowJoin(false)
      setInviteCode('')
      router.push(`/workspace/${ws.id}`)
    } catch {
      setJoinError('Invalid invite code or already a member')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Account Book</h1>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Workspaces</h2>
            <p className="text-sm text-gray-500 mt-0.5">Select a workspace or create a new one</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="secondary" onClick={() => setShowJoin(true)}>
              <LinkIcon className="w-4 h-4" /> Join
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Workspace
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(ws => (
              <button key={ws.id} onClick={() => router.push(`/workspace/${ws.id}`)}
                className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{ws.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Created {format(new Date(ws.created_at), 'dd MMM yyyy')}
                </p>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  (ws as { role: string }).role === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                }`}>{(ws as { role: string }).role}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No workspaces yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Create a new workspace or join one with an invite link</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setShowJoin(true)}>Join with invite</Button>
              <Button onClick={() => setShowCreate(true)}>Create workspace</Button>
            </div>
          </div>
        )}
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Workspace">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Workspace Name" value={wsName} onChange={e => setWsName(e.target.value)}
            placeholder="e.g. Business Expenses 2026" autoFocus />
          {createError && <p className="text-sm text-red-500">{createError}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={createWs.isPending} className="flex-1">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join Workspace">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <Input label="Invite Link or Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
            placeholder="Paste invite link or code" autoFocus />
          {joinError && <p className="text-sm text-red-500">{joinError}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowJoin(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={joinWs.isPending} className="flex-1">Join</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
