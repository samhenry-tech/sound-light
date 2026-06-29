import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { AmbientEngine } from './ambientEngine';

/**
 * Headless component that owns the {@link AmbientEngine} and keeps it in sync
 * with the ambient settings. Rendered once near the app root.
 */
export function AmbientController() {
  const kind = useSettingsStore((s) => s.ambientKind);
  const volume = useSettingsStore((s) => s.ambientVolume);
  const engineRef = useRef<AmbientEngine | null>(null);

  useEffect(() => {
    const engine = new AmbientEngine();
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (kind) void engine.start(kind);
    else engine.stop();
  }, [kind]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  return null;
}
