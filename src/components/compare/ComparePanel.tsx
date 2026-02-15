import { startups } from "@/data/startups";

export function ComparePanel({
  ids,
  onRemove,
}: {
  ids: string[];
  onRemove: (id: string) => void;
}) {
  if (ids.length < 2) return null;

  const items = ids
    .map(id => startups.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className="absolute bottom-4 right-4 z-40 bg-background border rounded-xl p-4 w-105">
      <p className="text-sm font-semibold mb-3">Compare startups</p>

      <div className="grid grid-cols-2 gap-3">
        {items.map(s => (
          <div key={s!.id} className="border rounded p-2">
            <div className="flex justify-between">
              <p className="font-medium">{s!.name}</p>
              <button
                onClick={() => onRemove(s!.id)}
                className="text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {s!.industries.join(", ")}
            </p>

            <p className="text-xs">
              Jobs: {s!.jobs.total}
            </p>

            <p className="text-xs">
              Stage: {s!.funding.stage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}