'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { djangoApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Pencil, X, Check, Eye, EyeOff } from 'lucide-react';
import { modelsByModality } from '@/lib/models/registry';

// ── Default model preference helpers ─────────────────────────────────────────

const DEFAULTS_KEY = 'mediagen_default_models';

function loadDefaults(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY) ?? '{}'); } catch { return {}; }
}

function saveDefaults(d: Record<string, string>) {
  try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(d)); } catch {}
}

function builtinDefault(modality: 'image' | 'video' | 'audio'): string {
  const first = modelsByModality(modality).find(({ config }) => !config.comingSoon);
  return first?.slug ?? '';
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, isLoading, updateUser } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  const [showPwForm, setShowPwForm] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  function startEditName() {
    setNameVal(user?.name ?? '');
    setEditingName(true);
  }

  async function saveName() {
    if (!nameVal.trim()) return;
    setNameSaving(true);
    try {
      const updated = await djangoApi.updateMe({ name: nameVal.trim() });
      updateUser(updated as { id: number; name: string; email: string });
      setEditingName(false);
      toast.success('Name updated');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function savePassword() {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await djangoApi.changePassword({ old_password: oldPw, new_password: newPw });
      toast.success('Password changed');
      setShowPwForm(false);
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
        <div className="py-3"><Skeleton className="h-4 w-48" /></div>
        <div className="py-3"><Skeleton className="h-4 w-64" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
        {/* Name */}
        <div className="flex items-center justify-between py-3 gap-3">
          <span className="text-sm text-muted-foreground shrink-0">Name</span>
          {editingName ? (
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="h-7 text-sm max-w-[200px]"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={saveName} disabled={nameSaving}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingName(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user?.name ?? '—'}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={startEditName}>
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm font-medium">{user?.email ?? '—'}</span>
        </div>

        {/* Account tier */}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-muted-foreground">Account</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            Free
          </span>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPwForm((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
        >
          <span className="font-medium">Change password</span>
          <span className="text-xs text-muted-foreground">{showPwForm ? 'Cancel' : 'Update'}</span>
        </button>

        {showPwForm && (
          <div className="px-4 pb-4 space-y-3 border-t border-border">
            <div className="pt-3 space-y-1.5">
              <Label className="text-xs">Current password</Label>
              <div className="relative">
                <Input
                  type={showOld ? 'text' : 'password'}
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  className="pr-9 text-sm"
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowOld((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showOld ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="pr-9 text-sm"
                  placeholder="Min 8 characters"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm new password</Label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') savePassword(); }}
                className="text-sm"
                placeholder="Repeat new password"
              />
            </div>
            <Button
              onClick={savePassword}
              disabled={pwSaving || !oldPw || !newPw || !confirmPw}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              size="sm"
            >
              {pwSaving ? 'Saving…' : 'Update password'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── API Keys tab ──────────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    key: 'replicate' as const,
    envVar: 'REPLICATE_API_TOKEN',
    label: 'Replicate',
    description: 'Image & video generation',
    docsUrl: 'https://replicate.com/account/api-tokens',
  },
  {
    key: 'akashml' as const,
    envVar: 'AKASHML_API_KEY',
    label: 'AkashML',
    description: 'Alternative compute provider',
    docsUrl: 'https://akash.network/',
  },
];

function ApiKeysTab() {
  const [status, setStatus] = useState<{ replicate: boolean; akashml: boolean } | null>(null);

  useEffect(() => {
    djangoApi.providersStatus().then(setStatus);
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Configured in your{' '}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code> file on the server.
        Restart the dev server after changing them.
      </p>

      <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
        {PROVIDERS.map(({ key, envVar, label, description, docsUrl }) => {
          const configured = status?.[key];
          return (
            <div key={key} className="flex items-center justify-between py-3.5 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {status === null ? (
                  <Skeleton className="w-4 h-4 rounded-full" />
                ) : configured ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground/60">{description}</p>
                  <p className="text-xs text-muted-foreground/40 font-mono mt-0.5">{envVar}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {status !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    configured
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}>
                    {configured ? 'Configured' : 'Missing'}
                  </span>
                )}
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-600 hover:underline"
                >
                  Get key →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground/60">
        API keys are read from environment variables and never stored in the database.
      </p>
    </div>
  );
}

// ── Default Models tab ────────────────────────────────────────────────────────

const MODALITIES: { value: 'image' | 'video' | 'audio'; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
];

function DefaultModelsTab() {
  const [defaults, setDefaults] = useState<Record<string, string>>(() => {
    const saved = loadDefaults();
    const merged: Record<string, string> = {};
    for (const { value } of MODALITIES) {
      merged[value] = saved[value] ?? builtinDefault(value);
    }
    return merged;
  });

  function pick(modality: string, slug: string) {
    const next = { ...defaults, [modality]: slug };
    setDefaults(next);
    saveDefaults(next);
    toast.success('Default model updated');
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the default model selected when you open the Generate page for each modality.
        Saved locally in your browser.
      </p>

      {MODALITIES.map(({ value, label }) => {
        const available = modelsByModality(value).filter(({ config }) => !config.comingSoon);
        const current = defaults[value] ?? builtinDefault(value);
        return (
          <div key={value} className="space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <div className="grid grid-cols-2 gap-2">
              {available.map(({ slug, config }) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => pick(value, slug)}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all',
                    current === slug
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')}
                >
                  {current === slug && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{config.label}</p>
                    <p className="text-xs opacity-60 truncate font-mono">{slug}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground/60">
        Coming-soon models are hidden until they become available.
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
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
          <ProfileTab />
        </TabsContent>

        <TabsContent value="api-keys" className="mt-4">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <DefaultModelsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
