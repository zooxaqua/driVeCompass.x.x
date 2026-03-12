import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ドライブ・コンパス',
  description: '節約とタイパの天秤 — 3ルート比較で最適なドライブを',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
