"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Profile } from "./domain";

/**
 * 사용자 프로필 — 이 기기의 localStorage에만 저장한다(서버로 보내지 않는다).
 * useSyncExternalStore로 읽어서 서버 렌더(빈 프로필)와 브라우저 값이 어긋나도 hydration 오류가 나지 않는다.
 */
const KEY = "cheongyakfit.profile.v1";
const EMPTY: Profile = Object.freeze({}) as Profile;
const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cache: Profile = EMPTY;

function read(): Profile {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== cacheRaw) {
      cacheRaw = raw;
      cache = raw ? (JSON.parse(raw) as Profile) : EMPTY;
    }
  } catch {
    // 사생활 보호 모드 등에서 저장소 접근이 막히면 빈 프로필로 동작한다
  }
  return cache;
}

function write(next: Profile) {
  cache = next;
  try {
    cacheRaw = JSON.stringify(next);
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    cacheRaw = undefined;
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProfile() {
  const profile = useSyncExternalStore(subscribe, read, () => EMPTY);
  const update = useCallback((patch: Partial<Profile>) => {
    const next = { ...read(), ...patch };
    for (const k of Object.keys(patch) as (keyof Profile)[]) if (patch[k] === undefined) delete next[k];
    write(next);
  }, []);
  const reset = useCallback(() => write({}), []);
  return { profile, update, reset };
}

const noop = () => () => {};
/** 브라우저에서 한 번 그려진 뒤 true — 저장된 프로필을 읽었는지 구분할 때 쓴다 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function isEmptyProfile(p: Profile) {
  return Object.keys(p).length === 0;
}
