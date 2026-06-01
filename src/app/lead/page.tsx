import { Suspense } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { ManagerApp } from "@/components/manager/ManagerApp";

export default function LeadPage() {
  return (
    <AuthGate>
      <Suspense
        fallback={
          <div className="flex min-h-[100dvh] items-center justify-center text-zinc-500">
            Loading…
          </div>
        }
      >
        <ManagerApp />
      </Suspense>
    </AuthGate>
  );
}
