import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
})

export const metadata = {
  title: 'Workout AI',
  description: 'AIがあなたに最適なトレーニングメニューを提案します',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={geist.className}>
      <body>{children}</body>
    </html>
  )
}
