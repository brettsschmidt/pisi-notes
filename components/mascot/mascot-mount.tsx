"use client";

import dynamic from "next/dynamic";

// Pisi is entirely client-side (position depends on viewport + localStorage).
// Loading her with ssr:false avoids any hydration mismatch and lets the
// component use a synchronous lazy initializer for her saved position.
const Mascot = dynamic(() => import("./mascot").then((m) => m.Mascot), {
  ssr: false,
});

export function MascotMount() {
  return <Mascot greetOnMount />;
}
