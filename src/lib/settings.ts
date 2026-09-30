import { defaultSettings } from "@/data/samples";
import type { NotifyTopic, SiteSettings } from "@/lib/types";

/** Fills in defaults group by group, so settings added after a save keep working. */
export function mergeSettings(saved: Partial<SiteSettings>): SiteSettings {
  return {
    company: { ...defaultSettings.company, ...saved.company },
    contact: {
      ...defaultSettings.contact,
      ...saved.contact,
      address: { ...defaultSettings.contact.address, ...saved.contact?.address },
    },
    socials: { ...defaultSettings.socials, ...saved.socials },
    memberships: saved.memberships ?? defaultSettings.memberships,
    stats: saved.stats?.length ? saved.stats : defaultSettings.stats,
    seo: {
      ...defaultSettings.seo,
      ...saved.seo,
      verification: { ...defaultSettings.seo.verification, ...saved.seo?.verification },
      pages: saved.seo?.pages ?? {},
    },
    analytics: { ...defaultSettings.analytics, ...saved.analytics },
    notifications: {
      telegram: {
        ...defaultSettings.notifications.telegram,
        ...saved.notifications?.telegram,
        topics: Object.fromEntries(
          Object.entries(defaultSettings.notifications.telegram.topics).map(([key, value]) => [
            key,
            { ...value, ...saved.notifications?.telegram?.topics?.[key as NotifyTopic] },
          ]),
        ) as SiteSettings["notifications"]["telegram"]["topics"],
      },
    },
  };
}
