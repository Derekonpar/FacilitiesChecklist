import { PinGate } from "@/components/manager/PinGate";
import { ManagerApp } from "@/components/manager/ManagerApp";

export default function LeadPage() {
  return (
    <PinGate>
      <ManagerApp />
    </PinGate>
  );
}
