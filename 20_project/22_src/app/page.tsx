'use client'

import { useState } from 'react'
import { buildScreenModel } from '@/lib/viewModel'
import type { ScreenModel } from '@/lib/viewModel'

type Status = 'idle' | 'loading' | 'success' | 'partial_success' | 'error'

interface ApiResponse {
  status: string
  routes: {
    type: string
    distanceKm: number
    durationMin: number
    tollYen: number
    fuelCostYen: number
    totalCostYen: number
  }[]
  experienceValue: {
    diffYen: number
    message: string
  }
  message?: string
}

export default function HomePage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [fuelEfficiency, setFuelEfficiency] = useState(15)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<ScreenModel | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setResult(null)
    setErrorMsg('')

    try {
      const res = await fetch('/api/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          fuelEfficiencyKmL: fuelEfficiency,
        }),
      })

      const data: ApiResponse = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.message ?? 'エラーが発生しました')
        return
      }

      const screen = buildScreenModel({
        routes: data.routes,
        fuelPrices: {},
        experienceValue: data.experienceValue,
      })

      setResult(screen)
      setStatus((data.status as Status) === 'partial_success' ? 'partial_success' : 'success')
    } catch {
      setStatus('error')
      setErrorMsg('通信エラーが発生しました。再度お試しください。')
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>ドライブ・コンパス</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: '0.25rem' }}>出発地</span>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
              placeholder="例: 東京駅"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>

          <label style={{ flex: 1 }}>
            <span style={{ display: 'block', marginBottom: '0.25rem' }}>到着地</span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              placeholder="例: 大阪駅"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>

          <label style={{ minWidth: 160 }}>
            <span style={{ display: 'block', marginBottom: '0.25rem' }}>燃費 (km/L)</span>
            <input
              type="number"
              value={fuelEfficiency}
              onChange={(e) => setFuelEfficiency(Number(e.target.value))}
              min={1}
              max={100}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            alignSelf: 'flex-start',
            padding: '0.6rem 1.5rem',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {status === 'loading' ? '比較中...' : 'ルートを比較'}
        </button>
      </form>

      {status === 'error' && (
        <p style={{ color: '#c00', padding: '0.75rem', background: '#fff0f0', borderRadius: 4 }}>
          {errorMsg}
        </p>
      )}

      {(status === 'success' || status === 'partial_success') && result && (
        <section>
          {status === 'partial_success' && (
            <p style={{ color: '#856404', background: '#fff3cd', padding: '0.5rem 1rem', borderRadius: 4, marginBottom: '1rem' }}>
              一部データが取得できませんでした。表示可能な結果を表示しています。
            </p>
          )}
          <h2 style={{ marginBottom: '1rem' }}>比較結果</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {result.cards.map((card) => (
              <div
                key={card.title}
                style={{
                  flex: '1 1 220px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '1.25rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: '#0070f3' }}>
                  {{
                    fastest: '最速ルート',
                    smart_saving: '賢く節約',
                    full_saving: '完全節約',
                  }[card.title] ?? card.title}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#666' }}>所要時間</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>{card.timeLabel}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#666' }}>高速料金</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>{card.tollLabel}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.3rem 0', color: '#666' }}>燃料費</td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>{card.fuelLabel}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem 0 0.3rem', fontWeight: 700 }}>合計</td>
                      <td style={{ padding: '0.5rem 0 0.3rem', textAlign: 'right', fontWeight: 700 }}>{card.totalLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {result.experience && (
            <p style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: '#e8f4fd', borderRadius: 4 }}>
              💡 節約差額の体験価値: {result.experience}
            </p>
          )}
        </section>
      )}
    </main>
  )
}
