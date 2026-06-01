import { Suspense } from "react";
import { PinGate } from "@/components/manager/PinGate";
import { ManagerApp } from "@/components/manager/ManagerApp";

export default function LeadPage() {
  return (
    <PinGate>
      <Suspense
        fallback={
          <div className="flex min-h-[100dvh] items-center justify-center text-zinc-500">
            Loading…
          </div>
        }
      >
        <ManagerApp />
      </Suspense>
    </PinGate>
  );
}
