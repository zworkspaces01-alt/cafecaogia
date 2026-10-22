"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Shared by the Studio editors: undo/redo over whole snapshots and the keyboard shortcuts.

/** Edits closer together than this become one undo step, so typing isn't undone a letter at a time. */
const MERGE_MS = 600;
const UNDO_LIMIT = 80;

export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Undo history of `current`. Call remember() before each edit; undo/redo hand the snapshot to
 * `apply`, which sets it as the editor's state.
 */
export function useUndo<T>(current: T, apply: (snapshot: T) => void) {
  const latest = useRef(current);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastEdit = useRef(0);
  const [state, setState] = useState({ canUndo: false, canRedo: false });
  useLayoutEffect(() => {
    latest.current = current;
  });

  const sync = () => setState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });

  const remember = () => {
    const now = Date.now();
    if (now - lastEdit.current > MERGE_MS || past.current.length === 0) {
      past.current = [...past.current.slice(-(UNDO_LIMIT - 1)), latest.current];
    }
    lastEdit.current = now;
    future.current = [];
    sync();
  };
  const undo = () => {
    const previous = past.current.at(-1);
    if (previous === undefined) return;
    past.current = past.current.slice(0, -1);
    future.current = [latest.current, ...future.current];
    lastEdit.current = 0;
    apply(previous);
    sync();
  };
  const redo = () => {
    const next = future.current[0];
    if (next === undefined) return;
    future.current = future.current.slice(1);
    past.current = [...past.current, latest.current];
    lastEdit.current = 0;
    apply(next);
    sync();
  };
  const reset = () => {
    past.current = [];
    future.current = [];
    sync();
  };
  return { ...state, remember, undo, redo, reset };
}

/** ⌘Z / ⇧⌘Z / ⌘Y undo and redo (left to the browser while typing in a field), ⌘S saves now. */
export function useEditorKeys(handlers: { undo: () => void; redo: () => void; save: () => void }) {
  const ref = useRef(handlers);
  useLayoutEffect(() => {
    ref.current = handlers;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        ref.current.save();
      } else if ((key === "z" || key === "y") && !isTyping(event.target)) {
        event.preventDefault();
        if (key === "y" || event.shiftKey) ref.current.redo();
        else ref.current.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Warns before leaving the page while `active` (an edit hasn't reached the server yet). */
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [active]);
}

/** Runs `save` once edits pause for `delay` ms while `pending`. */
export function useAutosave(pending: boolean, deps: unknown, save: () => void, delay = 800) {
  const saveRef = useRef(save);
  useLayoutEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => saveRef.current(), delay);
    return () => clearTimeout(timer);
  }, [pending, deps, delay]);
}

/** A stable function that always calls the latest `fn`. */
export function useLatest<A extends unknown[], R>(fn: (...args: A) => R) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
