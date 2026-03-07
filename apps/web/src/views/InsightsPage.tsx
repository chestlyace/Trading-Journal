import React from 'react'
import { useInsights } from '../hooks/useInsights'

export function InsightsPage() {
  const { data, isLoading } = useInsights()

  if (isLoading) return <div style={{ padding: '1.5rem' }}>Loading insights...</div>

  const insights = data?.data ?? []

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>AI Insights</h1>
      {insights.length === 0 ? (
        <p>No insights yet.</p>
      ) : (
        <ul>
          {insights.map((insight: any) => (
            <li key={insight.id} style={{ marginBottom: '1rem' }}>
              <strong>{insight.title}</strong>
              <p>{insight.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

