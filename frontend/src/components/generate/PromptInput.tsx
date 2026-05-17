'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PromptInputProps {
  prompt: string;
  negativePrompt: string;
  onPromptChange: (v: string) => void;
  onNegativeChange: (v: string) => void;
  showNegative?: boolean;
}

const MAX = 2000;
const MAX_NEG = 500;

export function PromptInput({
  prompt,
  negativePrompt,
  onPromptChange,
  onNegativeChange,
  showNegative = true,
}: PromptInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="prompt" className="text-sm font-medium">Prompt</Label>
        <span className="text-xs text-muted-foreground/60">{prompt.length}/{MAX}</span>
      </div>
      <Textarea
        id="prompt"
        placeholder="Describe what you want to generate…"
        rows={4}
        maxLength={MAX}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="resize-none text-sm"
      />

      {showNegative && (
        <details className="group">
          <summary className="text-xs text-muted-foreground/60 cursor-pointer select-none hover:text-foreground list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            Negative prompt
          </summary>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/60">What to avoid</span>
              <span className="text-xs text-muted-foreground/60">{negativePrompt.length}/{MAX_NEG}</span>
            </div>
            <Textarea
              placeholder="blurry, low quality, watermark…"
              rows={2}
              maxLength={MAX_NEG}
              value={negativePrompt}
              onChange={(e) => onNegativeChange(e.target.value)}
              className="resize-none text-sm"
            />
          </div>
        </details>
      )}
    </div>
  );
}
