'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PromptPreviewProps {
  prompt: string;
  editable?: boolean;
  onEdit?: (value: string) => void;
}

export function PromptPreview({ prompt, editable = false, onEdit }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Assembled prompt
        </span>
        <button
          type="button"
          onClick={copy}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Copy prompt"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {editable && onEdit ? (
        <textarea
          value={prompt}
          onChange={(e) => onEdit(e.target.value)}
          rows={4}
          className="w-full bg-transparent px-3 py-2 text-xs text-foreground resize-none focus:outline-none placeholder:text-muted-foreground/40"
          placeholder="Fill the form above to assemble a prompt…"
        />
      ) : (
        <p className={`px-3 py-2 text-xs leading-relaxed min-h-[60px] ${prompt ? 'text-foreground' : 'text-muted-foreground/40 italic'}`}>
          {prompt || 'Fill the form above to assemble a prompt…'}
        </p>
      )}
    </div>
  );
}
