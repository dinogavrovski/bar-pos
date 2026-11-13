// Server component (the default in the App Router): this runs on the Next.js server,
// so the browser receives finished HTML and never calls the API itself.

// Render on every request. Without this, Next may render the page once at build time
// and show that frozen status forever (and the build would need the API running).
export const dynamic = 'force-dynamic'

// Server-to-server address of the API. In Docker this will become http://api:3001.
const API_URL = process.env.API_URL ?? 'http://localhost:3001'

type Status = 'up' | 'down'

async function getStatus(): Promise<{ api: Status; db: Status }> {
  try {
    const res = await fetch(`${API_URL}/api/health/ready`, {
      cache: 'no-store', // always ask the API, never reuse a cached answer
      signal: AbortSignal.timeout(3000), // don't let a hung API hang the page
    })
    // The API answered, so it's up. 200 = DB up, 503 = DB down.
    return { api: 'up', db: res.ok ? 'up' : 'down' }
  } catch {
    // No answer at all (not running, refused, timed out): we can't know the DB state.
    return { api: 'down', db: 'down' }
  }
}

export default async function HomePage() {
  const status = await getStatus()

  return (
    <main style={{ padding: 24 }}>
      <h1>Bar POS</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <StatusRow label="API" status={status.api} />
        <StatusRow label="Database" status={status.db} />
      </ul>
      <p style={{ color: '#666' }}>Checked at {new Date().toLocaleTimeString('en-GB')}</p>
    </main>
  )
}

function StatusRow({ label, status }: { label: string; status: Status }) {
  return (
    <li>
      {status === 'up' ? '🟢' : '🔴'} {label}: <strong>{status}</strong>
    </li>
  )
}
