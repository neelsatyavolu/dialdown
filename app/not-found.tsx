import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <header className="hero">
        <h1>Page not found</h1>
        <p className="prose">There is nothing at this address.</p>
        <p className="not-found-link">
          <Link href="/">Back to the leaderboard</Link>
        </p>
      </header>
    </main>
  );
}
