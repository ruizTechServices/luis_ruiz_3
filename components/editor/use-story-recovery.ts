"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { StoryRecovery, writingFields } from "@/lib/editor/recovery";
import type { EditorStory } from "@/lib/editor/types";

export function useStoryRecovery(ownerId: string, initialStory: EditorStory | null) {
  const [recovery] = useState(() => new StoryRecovery({
    scope: { ownerId, storyId: initialStory?.id ?? null },
    fields: writingFields(initialStory),
    serverSavedAt: initialStory?.updated_at ?? null,
    storage: () => window.localStorage,
    randomId: () => crypto.randomUUID(),
  }));
  const snapshot = useSyncExternalStore(recovery.subscribe, recovery.getSnapshot, recovery.getServerSnapshot);

  useEffect(() => {
    recovery.initialize();
    const onVisibility = () => { if (document.visibilityState === "hidden") recovery.flush(); else recovery.refresh(); };
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key.startsWith("luis-ruiz:story-recovery:")) recovery.refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", recovery.flush);
    window.addEventListener("beforeunload", recovery.flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", recovery.flush);
      window.removeEventListener("beforeunload", recovery.flush);
      document.removeEventListener("visibilitychange", onVisibility);
      recovery.stop();
    };
  }, [recovery]);

  return { recovery, snapshot };
}
