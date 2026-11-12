import { startups } from "@/data/startups";

export function RecentPanel({
  ids,
  onSelect,
}: {
  ids: string[];
  onSelect: (id: string) => void;
}) {
  if (!ids.length) return null;

  return (
    <div className="absolute left-4 bottom-4 z-20 w-64 bg-background border rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold">Recently viewed</p>

      {ids.map((id) => {
        const s = startups.find((x) => x.id === id);
        if (!s) return null;

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="w-full text-left text-sm hover:bg-muted px-2 py-1 rounded"
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
