"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AskWikiPanel } from "./ask-wiki-panel";
import {
  getLaunchOrigin,
  writeAskWikiLaunchState,
} from "./ask-wiki-launch-state";

export function AskWikiProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const isDocsRoute = pathname === "/docs" || pathname.startsWith("/docs/");

  if (!isDocsRoute || pathname === "/ask-wiki") {
    return null;
  }

  const launch = (autoSubmit: boolean) => {
    writeAskWikiLaunchState({
      createdAt: Date.now(),
      question: question.trim(),
      autoSubmit,
      origin: getLaunchOrigin(buttonRef.current),
    });

    router.push("/ask-wiki");
  };

  return (
    <AskWikiPanel
      buttonRef={buttonRef}
      isOpen={isOpen}
      question={question}
      onToggle={() => setIsOpen((value) => !value)}
      onQuestionChange={setQuestion}
      onOpenRoute={() => launch(false)}
      onSubmit={() => launch(true)}
    />
  );
}
