import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">India Tax Tracker</h1>
        <p className="text-gray-500 text-lg">
          Where does India&apos;s tax money go? One URL, any state, any financial year.
        </p>
        <div className="pt-2">
          <Link
            href="/state/maharashtra"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            View Maharashtra prototype →
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Prototype · Data source: PIB press releases
        </p>
      </div>
    </main>
  );
}
