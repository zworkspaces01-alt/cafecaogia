import { SectionHeading } from "@/components/ui";
import { localeTags } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import { cn } from "@/lib/utils";

type Phase = "harvest" | "newCrop";

// Month indexes (0 = January). Typical seasons — adjust to Cao Gia's actual crop plan.
// Month indexes (0 = January), same order as `harvest.crops` in the dictionaries.
// Typical seasons — adjust to Cao Gia's actual crop plan.
const cropPhases: Partial<Record<number, Phase>>[] = [
  { 10: "harvest", 11: "harvest", 0: "harvest", 1: "newCrop", 2: "newCrop", 3: "newCrop" },
  { 9: "harvest", 10: "harvest", 11: "harvest", 0: "newCrop", 1: "newCrop" },
  { 1: "harvest", 2: "harvest", 3: "harvest", 4: "harvest", 5: "newCrop", 6: "newCrop", 7: "newCrop" },
];

const phaseStyle: Record<Phase, string> = {
  harvest: "bg-lime",
  newCrop: "bg-leaf/25",
};

export async function HarvestCalendar() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.harvest;
  const current = new Date().getMonth();
  const monthFormat = new Intl.DateTimeFormat(localeTags[locale], { month: "short" });
  const months = Array.from({ length: 12 }, (_, i) => monthFormat.format(new Date(2026, i, 15)));
  const crops = t.crops.map((crop, i) => ({ ...crop, phases: cropPhases[i] }));

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          accent={t.accent}
          description={t.description}
        />

        <div data-reveal className="relative mt-12 overflow-x-auto rounded-3xl bg-sand p-4 md:p-6">
          <table className="w-full min-w-[720px] border-separate border-spacing-x-1 border-spacing-y-2 text-sm">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr>
                <th scope="col" className="w-40 text-start font-normal text-muted">
                  <span className="sr-only">{t.cropColumn}</span>
                </th>
                {months.map((m, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={cn("pb-1 text-center text-xs font-medium", i === current ? "text-forest" : "text-muted")}
                  >
                    {m}
                    {i === current && <span className="mx-auto mt-1 block size-1.5 rounded-full bg-forest" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody data-grow-group>
              {crops.map((crop) => (
                <tr key={crop.name}>
                  <th scope="row" className="pe-4 text-start">
                    <span className="block font-medium text-forest">{crop.name}</span>
                    <span className="block text-xs font-normal text-muted">{crop.region}</span>
                  </th>
                  {months.map((m, i) => {
                    const phase = crop.phases[i];
                    return (
                      <td key={i} className="p-0">
                        <span
                          data-grow={phase ? "" : undefined}
                          className={cn(
                            "block h-10 origin-left rounded-lg rtl:origin-right",
                            phase ? phaseStyle[phase] : "bg-white",
                            i === current && "ring-2 ring-forest/30",
                          )}
                        >
                          <span className="sr-only">
                            {phase === "harvest" ? t.legend.harvest : phase === "newCrop" ? t.legend.newCrop : t.legend.stock}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-lime" /> {t.legend.harvest}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded bg-leaf/25" /> {t.legend.newCrop}
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded border border-mist bg-white" /> {t.legend.stock}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
