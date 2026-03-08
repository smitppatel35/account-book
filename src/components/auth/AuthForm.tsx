'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'signup' && (
        <Input label="Full Name" type="text" value={fullName}
          onChange={e => setFullName(e.target.value)} placeholder="Your name" required />
      )}
      <Input label="Email" type="email" value={email}
        onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
      <Input label="Password" type="password" value={password}
        onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="mt-1">
        {mode === 'signup' ? 'Create Account' : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {mode === 'login' ? (
          <>Don&apos;t have an account? <Link href="/signup" className="text-indigo-600 hover:underline font-medium">Sign up</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link></>
        )}
      </p>
    </form>
  )
}
