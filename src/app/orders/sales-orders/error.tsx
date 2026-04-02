"use client";

export default function SalesOrdersError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-red-400">Sales Orders Error</h2>
      <pre className="bg-zinc-900 p-4 rounded-lg text-red-300 text-sm overflow-auto whitespace-pre-wrap">
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-lg">
        Try Again
      </button>
    </div>
  );
}
