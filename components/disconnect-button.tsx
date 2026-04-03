"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type DisconnectButtonProps = {
  provider: "LINKEDIN" | "GOOGLE";
};

export function DisconnectButton({ provider }: DisconnectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    const response = await fetch("/api/connections/disconnect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ provider })
    });

    if (!response.ok) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button className="button--secondary" onClick={handleClick} type="button" disabled={isPending}>
      {isPending ? "Disconnecting..." : "Disconnect"}
    </button>
  );
}

