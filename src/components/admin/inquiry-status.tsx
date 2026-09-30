"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setInquiryStatus } from "@/app/admin/actions";

export function InquiryStatusSelect({
  id,
  status,
  labels,
}: {
  id: string;
  status: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-2">
      {pending && <Loader2 className="size-4 animate-spin text-muted" />}
      <select
        aria-label="Trạng thái"
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setInquiryStatus(id, e.target.value);
            router.refresh();
          })
        }
        className="rounded-full border border-mist bg-white px-3 py-1.5 text-sm text-forest"
      >
        {Object.entries(labels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </span>
  );
}
