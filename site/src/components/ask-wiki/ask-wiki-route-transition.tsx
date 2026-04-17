"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { AskWikiLaunchOrigin } from "./ask-wiki-launch-state";

type AskWikiRouteTransitionProps = {
  origin: AskWikiLaunchOrigin | null;
  children: ReactNode;
};

export function AskWikiRouteTransition({
  origin,
  children,
}: AskWikiRouteTransitionProps) {
  const [isActive, setIsActive] = useState(Boolean(origin));

  useEffect(() => {
    if (!origin) return;

    const frame = window.requestAnimationFrame(() => {
      setIsActive(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [origin]);

  return (
    <div className="ask-route-stage">
      {origin ? (
        <div
          aria-hidden="true"
          className={`ask-route-transition${isActive ? " is-active" : " is-settled"}`}
          style={
            {
              "--ask-origin-left": `${origin.left}px`,
              "--ask-origin-top": `${origin.top}px`,
              "--ask-origin-width": `${origin.width}px`,
              "--ask-origin-height": `${origin.height}px`,
              "--ask-origin-radius": `${origin.radius}px`,
            } as CSSProperties
          }
        />
      ) : null}
      <div className="ask-route-content">{children}</div>
    </div>
  );
}
