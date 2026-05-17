import type { GenerationProvider, ProviderName } from './types';
import { ReplicateProvider } from './replicate';
import { AkashMLProvider } from './akashml';
import { FalProvider } from './fal';
import { ModalProvider } from './modal';
import { RunPodProvider } from './runpod';
import { modelRegistry } from '@/lib/models/registry';

const providers: Record<ProviderName, GenerationProvider> = {
  replicate: new ReplicateProvider(),
  akashml: new AkashMLProvider(),
  fal: new FalProvider(),
  modal: new ModalProvider(),
  runpod: new RunPodProvider(),
};

export function getProvider(name: ProviderName): GenerationProvider {
  return providers[name];
}

export function resolveProvider(modelSlug: string, override?: ProviderName): GenerationProvider {
  const model = modelRegistry[modelSlug];
  if (!model) throw new Error(`Unknown model slug: ${modelSlug}`);

  const providerName = override ?? model.defaultProvider;
  if (!providers[providerName]) throw new Error(`Unknown provider: ${providerName}`);

  return providers[providerName];
}
