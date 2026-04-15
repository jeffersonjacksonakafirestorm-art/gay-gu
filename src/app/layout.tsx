import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Groundwork — Your Business Runs Itself',
  description: 'Stop chasing invoices. Stop losing leads. Groundwork automates your entire job lifecycle from first contact to final payment — automatically.',
  keywords: 'business automation, quote software, invoice automation, job management, contractor software',
  openGraph: {
    title: 'Groundwork — Your Business Runs Itself',
    description: 'Stop chasing invoices. Stop losing leads. Groundwork automates your entire job lifecycle from first contact to final payment.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
