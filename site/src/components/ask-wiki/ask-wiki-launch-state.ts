export type AskWikiLaunchOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

export type AskWikiLaunchState = {
  createdAt: number;
  question: string;
  autoSubmit: boolean;
  origin: AskWikiLaunchOrigin | null;
};

const STORAGE_KEY = "think-flow:ask-wiki-launch";
const MAX_AGE_MS = 4000;

export function getLaunchOrigin(
  element: HTMLElement | null,
): AskWikiLaunchOrigin | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    radius: Math.min(rect.width, rect.height) / 2,
  };
}

export function writeAskWikiLaunchState(value: AskWikiLaunchState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function readAskWikiLaunchState(): AskWikiLaunchState | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AskWikiLaunchState;
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearAskWikiLaunchState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
