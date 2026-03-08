interface BadgeProps {
  children: React.ReactNode
  variant: 'credit' | 'debit' | 'cash' | 'online' | 'neutral'
}

const variants = {
  credit: 'bg-green-100 text-green-700',
  debit: 'bg-red-100 text-red-700',
  cash: 'bg-yellow-100 text-yellow-700',
  online: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

export function Badge({ children, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
