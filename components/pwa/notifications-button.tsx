"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  disablePush,
  enablePush,
  pushSubscribed,
  pushSupported,
} from "@/lib/push/client";

export function NotificationsButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Reading from the browser at mount; ignore the set-state-in-effect warning.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(pushSupported());
    pushSubscribed().then(setSubscribed);
  }, []);

  if (!supported) return null;

  function toggle() {
    setHint(null);
    startTransition(async () => {
      if (subscribed) {
        await disablePush();
        setSubscribed(false);
        setHint("notifications off");
      } else {
        const r = await enablePush();
        if (r.ok) {
          setSubscribed(true);
          setHint("notifications on");
        } else {
          setHint(r.reason ?? "failed");
        }
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggle}
        disabled={pending}
        aria-label={subscribed ? "disable notifications" : "enable notifications"}
        title={subscribed ? "Notifications on" : "Enable notifications"}
      >
        {subscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </Button>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
