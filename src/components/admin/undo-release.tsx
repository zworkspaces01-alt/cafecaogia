"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { undoRelease } from "@/app/admin/publish-actions";
import { useStudio } from "@/components/admin/studio";

export function UndoReleaseButton({ id }: { id: string }) {
  const router = useRouter();
  const { flash, refreshChanges } = useStudio();
  const [busy, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (!confirm("Nạp trạng thái trước lần xuất bản này vào bản nháp? Bản nháp hiện có của các mục đó sẽ bị thay thế.")) return;
        startTransition(async () => {
          const result = await undoRelease(id);
          if (!result.ok) return alert(result.error);
          flash(`Đã nạp ${result.count} mục vào bản nháp. Kiểm tra rồi bấm Xuất bản.`);
          refreshChanges();
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-mist px-3 py-1.5 text-sm text-forest hover:bg-sand disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Hoàn tác
    </button>
  );
}
