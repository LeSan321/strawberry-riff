import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

type MigrationResult = {
  id: string;
  name: string;
  oldPath: string;
  newUrl: string | null;
  error: string | null;
};

export default function AdminMigrateSamples() {
  const { user, loading } = useAuth();
  const [results, setResults] = useState<MigrationResult[] | null>(null);
  const [summary, setSummary] = useState<{ succeeded: number; failed: number } | null>(null);

  const migrate = trpc.admin.migrateInstrumentSamples.useMutation({
    onSuccess: (data) => {
      setResults(data.results);
      setSummary({ succeeded: data.succeeded, failed: data.failed });
    },
    onError: (err) => {
      alert("Migration failed: " + err.message);
    },
  });

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!user) return <div className="p-8 text-white">Not authenticated.</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Instrument Sample Migration</h1>
      <p className="text-gray-400 mb-6 text-sm">
        Migrates all 37 instrument palette samples from Forge CDN to Railway Tigris S3.
        This is a one-time operation. Only the project owner can run this.
      </p>

      {!results && (
        <Button
          onClick={() => migrate.mutate()}
          disabled={migrate.isPending}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 text-base"
        >
          {migrate.isPending ? "Migrating... (this may take 1–2 minutes)" : "Run Migration"}
        </Button>
      )}

      {migrate.isPending && (
        <p className="mt-4 text-yellow-400 text-sm animate-pulse">
          Fetching and uploading 37 instrument samples to Tigris S3... please wait.
        </p>
      )}

      {summary && (
        <div className="mt-6 p-4 rounded-lg border border-gray-700 bg-gray-900 mb-4">
          <p className="text-lg font-semibold">
            ✅ {summary.succeeded} succeeded &nbsp;|&nbsp;
            {summary.failed > 0 ? `❌ ${summary.failed} failed` : "0 failed"}
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-2 mt-4">
          <p className="text-xs text-gray-500 mb-3">
            Copy the JSON below and send it to Manus to update the instrument catalog.
          </p>
          <textarea
            readOnly
            className="w-full h-96 bg-gray-900 text-green-400 text-xs font-mono p-3 rounded border border-gray-700"
            value={JSON.stringify(
              results.map((r) => ({ id: r.id, name: r.name, newUrl: r.newUrl, error: r.error })),
              null,
              2
            )}
          />
          <div className="space-y-1 mt-4">
            {results.map((r) => (
              <div
                key={r.id}
                className={`text-xs flex gap-2 items-start p-2 rounded ${
                  r.error ? "bg-red-950/40 text-red-400" : "bg-green-950/40 text-green-400"
                }`}
              >
                <span className="font-mono w-4">{r.error ? "✗" : "✓"}</span>
                <span className="font-semibold w-36 shrink-0">{r.name}</span>
                <span className="truncate text-gray-400">{r.error ?? r.newUrl}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
