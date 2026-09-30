import { MoveHorizontal } from "lucide-react";
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

        <div data-reveal className="relative mt-12 rounded-3xl bg-sand p-4 md:p-6">
          <p className="mb-3 flex items-center gap-2 text-xs text-muted md:hidden">
            <MoveHorizontal aria-hidden className="size-4" />
            {t.swipeHint}
          </p>
          {/* The crop column stays pinned while the months scroll; the edge fade hints at more. */}
          <div className="relative">
          <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-x-1 border-spacing-y-2 text-sm">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky start-0 z-10 w-28 bg-sand text-start font-normal text-muted md:w-40">
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
                  <th scope="row" className="sticky start-0 z-10 bg-sand pe-3 text-start md:pe-4">
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
          </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-sand to-transparent md:hidden rtl:bg-gradient-to-r"
            />
          </div>

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
