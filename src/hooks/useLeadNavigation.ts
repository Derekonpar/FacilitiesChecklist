"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildLeadHref,
  parseLeadSearchParams,
  type LeadUrlState,
} from "@/lib/lead-url";

export function useLeadNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parseLeadSearchParams(searchParams),
    [searchParams],
  );

  const navigate = useCallback(
    (patch: Partial<LeadUrlState>, options?: { replace?: boolean }) => {
      const next: LeadUrlState = { ...state, ...patch };
      const href = buildLeadHref(pathname, next);
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router, pathname, state],
  );

  const closeDetail = useCallback(() => {
    navigate(
      { issueId: null, maintenanceId: null },
      { replace: true },
    );
  }, [navigate]);

  return {
    view: state.view,
    tab: state.tab,
    issueId: state.issueId,
    maintenanceId: state.maintenanceId,
    navigate,
    closeDetail,
  };
}
