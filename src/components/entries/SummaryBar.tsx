import type { WorkspaceSummary } from '@/types'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n)
}

export function SummaryBar({ summary }: { summary: WorkspaceSummary }) {
  const { totalCredit, totalDebit, balance, creditCash, creditOnline, debitCash, debitOnline } = summary

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Credit */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Total Credit</span>
        </div>
        <p className="text-2xl font-bold text-green-700">₹{fmt(totalCredit)}</p>
        <div className="mt-2 flex gap-3 text-xs text-green-600">
          <span>Cash ₹{fmt(creditCash)}</span>
          <span>·</span>
          <span>Online ₹{fmt(creditOnline)}</span>
        </div>
      </div>

      {/* Debit */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-5 h-5 text-red-600" />
          <span className="text-sm font-medium text-red-700">Total Debit</span>
        </div>
        <p className="text-2xl font-bold text-red-700">₹{fmt(totalDebit)}</p>
        <div className="mt-2 flex gap-3 text-xs text-red-600">
          <span>Cash ₹{fmt(debitCash)}</span>
          <span>·</span>
          <span>Online ₹{fmt(debitOnline)}</span>
        </div>
      </div>

      {/* Balance */}
      <div className={`border rounded-xl p-4 ${balance >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Wallet className={`w-5 h-5 ${balance >= 0 ? 'text-indigo-600' : 'text-orange-600'}`} />
          <span className={`text-sm font-medium ${balance >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>Balance</span>
        </div>
        <p className={`text-2xl font-bold ${balance >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
          {balance < 0 ? '-' : ''}₹{fmt(Math.abs(balance))}
        </p>
        <p className={`mt-2 text-xs ${balance >= 0 ? 'text-indigo-500' : 'text-orange-500'}`}>
          {balance >= 0 ? 'Surplus' : 'Deficit'}
        </p>
      </div>
    </div>
  )
}
