"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100dvh", textAlign: "center" }}>
        <div>
          <h1>Something went wrong</h1>
          <button onClick={reset} style={{ padding: "0.7rem 1.2rem", borderRadius: 10, border: 0, background: "#0f766e", color: "#fff", fontWeight: 700 }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
