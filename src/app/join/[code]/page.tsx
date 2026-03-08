'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useJoinWorkspace } from '@/hooks/useWorkspace'
import { BookOpen } from 'lucide-react'

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const join = useJoinWorkspace()

  useEffect(() => {
    join.mutateAsync(code)
      .then(ws => router.push(`/workspace/${ws.id}`))
      .catch(() => router.push('/dashboard'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <p className="text-gray-600">Joining workspace...</p>
      </div>
    </div>
  )
}
