'use client'

import { RotateCcw } from 'lucide-react'

interface Filters {
  type: '' | 'credit' | 'debit'
  paymentMode: '' | 'cash' | 'online'
  dateFrom: string
  dateTo: string
}

interface EntryFiltersProps {
  filters: Filters
  onChange: (f: Filters) => void
}

export function EntryFilters({ filters, onChange }: EntryFiltersProps) {
  const set = (k: keyof Filters, v: string) => onChange({ ...filters, [k]: v })
  const reset = () => onChange({ type: '', paymentMode: '', dateFrom: '', dateTo: '' })
  const isDirty = Object.values(filters).some(Boolean)

  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Type</label>
        <select value={filters.type} onChange={e => set('type', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Payment Mode</label>
        <select value={filters.paymentMode} onChange={e => set('paymentMode', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All modes</option>
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">From</label>
        <input type="date" value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">To</label>
        <input type="date" value={filters.dateTo} onChange={e => set('dateTo', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      {isDirty && (
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors col-span-2 sm:col-span-1 justify-center sm:justify-start">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      )}
    </div>
  )
}
