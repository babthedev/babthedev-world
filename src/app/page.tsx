export default function Home() {
  // Visible experience lives entirely in GlobalCanvas (see layout.tsx).
  // This page exists for routing + the sr-only accessibility fallback.
  return (
    <main>
      <h1>Abdulrahman&apos;s Hub</h1>
      <p>
        An interactive, spatial portfolio. Walk through districts covering
        biography, projects, and essays. Requires WebGL.
      </p>
    </main>
  )
}