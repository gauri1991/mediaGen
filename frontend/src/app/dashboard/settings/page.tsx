'use client';

import { useAuth } from '@/contexts/auth';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

const PROVIDERS = [
  { key: 'REPLICATE_API_TOKEN', label: 'Replicate', docsUrl: 'https://replicate.com/account/api-tokens' },
  { key: 'AKASHML_API_KEY', label: 'AkashML', docsUrl: 'https://akash.network/' },
];

export default function SettingsPage() {
  const { user: session, isLoading: isPending } = useAuth();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Account and configuration</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="models">Default Models</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
            {isPending ? (
              <>
                <div className="py-3"><Skeleton className="h-4 w-48" /></div>
                <div className="py-3"><Skeleton className="h-4 w-64" /></div>
              </>
            ) : (
              <>
                <Field label="Name" value={session?.name ?? '—'} />
                <Field label="Email" value={session?.email ?? '—'} />
                <Field
                  label="Account"
                  value={<Badge variant="secondary" className="text-xs">Free</Badge>}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Configured in your <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> file on the server. Restart the dev server after changing them.
          </p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
            {PROVIDERS.map(({ key, label, docsUrl }) => (
              <div key={key} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground/60 font-mono">{key}</p>
                </div>
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-600 hover:underline"
                >
                  Get key →
                </a>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/60">
            API keys are read from environment variables and never stored in the database.
          </p>
        </TabsContent>

        <TabsContent value="models" className="mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
            <Field label="Image" value={<span className="font-mono text-xs">flux-schnell</span>} />
            <Field label="Video" value={<span className="font-mono text-xs">ltx-video</span>} />
            <Field label="Audio" value={<span className="font-mono text-xs">musicgen</span>} />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Default models are set in{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              src/lib/models/registry.ts
            </code>
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
