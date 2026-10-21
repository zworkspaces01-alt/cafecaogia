import { SettingsForm } from "@/components/admin/settings-form";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { first } from "@/lib/db";
import { mergeSettings } from "@/lib/settings";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  await requireAdmin();
  const data = await first<{ data: Partial<SiteSettings> }>("select data from site_settings where id = 1");
  const settings = mergeSettings(data?.data ?? {});

  return (
    <div className="space-y-6">
      <PageTitle title="Cài đặt công ty" description="Thông tin pháp lý, liên hệ, mạng xã hội và số liệu hiển thị trên website." />
      <SettingsForm initial={settings} />
    </div>
  );
}
