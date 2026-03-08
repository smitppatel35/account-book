import { ReactNode } from 'react'
import { Providers } from '../../providers'

export default function JoinLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>
}
