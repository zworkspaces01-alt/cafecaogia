"use client";

import { useState, useTransition } from "react";
import { saveAnalyticsSettings } from "@/app/admin/actions";
import { Badge, inputClass, Panel, SaveBar } from "@/components/admin/ui";
import { analyticsKeys, analyticsTools } from "@/lib/analytics-ids";
import type { AnalyticsSettings } from "@/lib/types";

export function AnalyticsForm({ initial }: { initial: AnalyticsSettings }) {
  const [ids, setIds] = useState(initial);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, start] = useTransition();

  const save = () =>
    start(async () => {
      const result = await saveAnalyticsSettings(ids);
      setStatus(
        result.ok
          ? { tone: "ok", text: "Đã lưu — mã đo lường có hiệu lực trên website (bản production)." }
          : { tone: "error", text: result.error },
      );
    });

  return (
    <div className="space-y-5">
      <Panel
        title="Kết nối công cụ đo lường"
        description="Điền mã của công cụ muốn dùng, để trống công cụ không dùng. Script chỉ chạy trên bản production, không chạy khi phát triển ở máy."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {analyticsKeys.map((key) => {
            const tool = analyticsTools[key];
            const valid = tool.pattern.test(ids[key].trim());
            return (
              <label key={key} className="grid content-start gap-1.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-forest">
                  {tool.label}
                  {initial[key] && <Badge tone="ok">Đang chạy</Badge>}
                  <a href={tool.dashboard} target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-leaf hover:underline">
                    mở báo cáo ↗
                  </a>
                </span>
                <input
                  className={inputClass}
                  value={ids[key]}
                  placeholder={tool.example}
                  spellCheck={false}
                  aria-invalid={Boolean(ids[key].trim()) && !valid}
                  onChange={(e) => {
                    setStatus(null);
                    setIds((prev) => ({ ...prev, [key]: e.target.value }));
                  }}
                />
                <span className="text-xs text-muted">
                  {ids[key].trim() && !valid ? (
                    <span className="text-red-600">Chưa đúng định dạng — ví dụ: {tool.example}</span>
                  ) : (
                    tool.help
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </Panel>
      <SaveBar label="Lưu mã đo lường" saving={saving} onSave={save} status={status} />
    </div>
  );
}
