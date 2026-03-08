'use client'

import { useState } from 'react'
import { Plus, Trash2, Link } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Entry, EntryLink } from '@/types'

interface LinkField { url: string; label: string }

interface EntryFormProps {
  initial?: Partial<Entry>
  onSubmit: (data: {
    type: 'credit' | 'debit'
    amount: number
    payment_mode: 'cash' | 'online'
    description: string
    date: string
    links: LinkField[]
  }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function EntryForm({ initial, onSubmit, onCancel, loading }: EntryFormProps) {
  const [type, setType] = useState<'credit' | 'debit'>(initial?.type ?? 'credit')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>(initial?.payment_mode ?? 'online')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split('T')[0])
  const [links, setLinks] = useState<LinkField[]>(
    initial?.entry_links?.map(l => ({ url: l.url, label: l.label ?? '' })) ?? []
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addLink = () => setLinks(l => [...l, { url: '', label: '' }])
  const removeLink = (i: number) => setLinks(l => l.filter((_, idx) => idx !== i))
  const updateLink = (i: number, field: keyof LinkField, value: string) =>
    setLinks(l => l.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid positive amount'
    if (!description.trim()) e.description = 'Description is required'
    if (!date) e.date = 'Date is required'
    links.forEach((l, i) => {
      try { new URL(l.url) } catch { e[`link_${i}`] = 'Invalid URL' }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit({ type, amount: Number(amount), payment_mode: paymentMode, description, date, links })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Type toggle */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Entry Type</label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${type === 'credit' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setType('credit')}
          >Credit (Received)</button>
          <button type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${type === 'debit' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setType('debit')}
          >Debit (Paid)</button>
        </div>
      </div>

      {/* Amount */}
      <Input label="Amount (₹)" type="number" min="0.01" step="0.01"
        value={amount} onChange={e => setAmount(e.target.value)}
        error={errors.amount} placeholder="0.00" />

      {/* Payment mode */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Payment Mode</label>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${paymentMode === 'cash' ? 'bg-yellow-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setPaymentMode('cash')}
          >Cash</button>
          <button type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${paymentMode === 'online' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setPaymentMode('online')}
          >Online</button>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea rows={2}
          className={`px-3 py-2 border text-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What is this entry for?" />
        {errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
      </div>

      {/* Date */}
      <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} error={errors.date} />

      {/* Links */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Reference Links</label>
          <button type="button" onClick={addLink} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
            <Plus className="w-3 h-3" /> Add link
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Link className="w-4 h-4 text-gray-400 mt-2.5 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <input type="url" placeholder="https://..." value={link.url}
                  onChange={e => updateLink(i, 'url', e.target.value)}
                  className={`px-2 py-1.5 text-gray-700 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${errors[`link_${i}`] ? 'border-red-400' : 'border-gray-300'}`} />
                <input type="text" placeholder="Label (optional)" value={link.label}
                  onChange={e => updateLink(i, 'label', e.target.value)}
                  className="px-2 py-1.5 border text-gray-700 border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                {errors[`link_${i}`] && <span className="text-xs text-red-500">{errors[`link_${i}`]}</span>}
              </div>
              <button type="button" onClick={() => removeLink(i)} className="p-1 text-red-400 hover:text-red-600 mt-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initial?.id ? 'Update Entry' : 'Add Entry'}
        </Button>
      </div>
    </form>
  )
}
