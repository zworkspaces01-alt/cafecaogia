import { SettingsForm } from "@/components/admin/settings-form";
import { PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { first } from "@/lib/db";
import { mergeSettings } from "@/lib/settings";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  await requirePermission("settings");
  const data = await first<{ data: Partial<SiteSettings> }>("select data from site_settings where id = 1");
  const settings = mergeSettings(data?.data ?? {});

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 md:p-8">
      <PageTitle title="Cài đặt công ty" description="Thông tin pháp lý, liên hệ, mạng xã hội và số liệu hiển thị trên website." />
      <SettingsForm initial={settings} />
    </div>
  );
}
