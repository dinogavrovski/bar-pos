import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bar POS',
  description: 'Point-of-sale for bars and restaurants',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
