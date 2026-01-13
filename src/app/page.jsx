"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/onboarding");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to onboarding...</div>
    </div>
  );
}
