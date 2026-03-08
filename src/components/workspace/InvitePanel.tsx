'use client'

import { useState } from 'react'
import { Copy, Check, Users } from 'lucide-react'
import { useWorkspaceMembers } from '@/hooks/useWorkspace'

export function InvitePanel({ workspaceId, inviteCode }: { workspaceId: string; inviteCode: string }) {
  const [copied, setCopied] = useState(false)
  const { data: members } = useWorkspaceMembers(workspaceId)

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  const copy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">Invite Link</label>
        <div className="flex gap-2">
          <input readOnly value={inviteLink}
            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-700" />
          <button onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Anyone with this link joins as an Editor</p>
      </div>

      {members && members.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <label className="text-xs font-medium text-gray-500">Members ({members.length})</label>
          </div>
          <div className="flex flex-col gap-1.5">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-700">{m.profiles?.full_name ?? m.profiles?.email}</p>
                  {m.profiles?.full_name && <p className="text-xs text-gray-400">{m.profiles.email}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.role === 'owner' ? 'bg-indigo-100 text-indigo-700' :
                  m.role === 'editor' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
