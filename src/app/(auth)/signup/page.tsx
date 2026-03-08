export const dynamic = 'force-dynamic'

import { AuthForm } from '@/components/auth/AuthForm'
import { BookOpen } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start tracking shared finances</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  )
}
