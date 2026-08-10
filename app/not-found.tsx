import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508] px-4">
      <div className="text-center">
        <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#1e2433] to-[#0f1117] select-none leading-none mb-8">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-[#64748b] mb-8 max-w-sm">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
