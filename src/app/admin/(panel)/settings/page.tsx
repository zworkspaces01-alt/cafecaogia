import { SettingsForm } from "@/components/admin/settings-form";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { mergeSettings } from "@/lib/settings";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const settings = mergeSettings((data?.data ?? {}) as Partial<SiteSettings>);

  return (
    <div className="space-y-6">
      <PageTitle title="Cài đặt công ty" description="Thông tin pháp lý, liên hệ, mạng xã hội và số liệu hiển thị trên website." />
      <SettingsForm initial={settings} />
    </div>
  );
}
