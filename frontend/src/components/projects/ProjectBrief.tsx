'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  description: string;
  onSave: (description: string) => Promise<void>;
}

export function ProjectBrief({ description, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(description);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {description ? (
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {description}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground italic">No brief yet. Add a creative direction for this project.</p>
        )}
        <Button variant="outline" size="sm" onClick={() => { setValue(description); setEditing(true); }}>
          {description ? 'Edit brief' : 'Add brief'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder="Describe the creative brief, goals, mood, references…"
        className="text-sm resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
}
