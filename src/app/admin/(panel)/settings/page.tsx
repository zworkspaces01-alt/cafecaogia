import { SettingsForm } from "@/components/admin/settings-form";
import { PageTitle } from "@/components/admin/ui";
import { defaultSettings } from "@/data/samples";
import { requireAdmin } from "@/lib/admin/auth";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const saved = (data?.data ?? {}) as Partial<SiteSettings>;
  const settings: SiteSettings = {
    company: { ...defaultSettings.company, ...saved.company },
    contact: { ...defaultSettings.contact, ...saved.contact, address: { ...defaultSettings.contact.address, ...saved.contact?.address } },
    socials: { ...defaultSettings.socials, ...saved.socials },
    memberships: saved.memberships ?? defaultSettings.memberships,
    stats: saved.stats?.length ? saved.stats : defaultSettings.stats,
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Cài đặt công ty" description="Thông tin pháp lý, liên hệ, mạng xã hội và số liệu hiển thị trên website." />
      <SettingsForm initial={settings} />
    </div>
  );
}
