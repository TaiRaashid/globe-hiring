import { startups } from "@/data/startups";

export function Suggestions({
  currentId,
  onSelect,
}: {
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const current = startups.find((s) => s.id === currentId);
  if (!current) return null;

  const matches = startups
    .filter(
      (s) =>
        s.id !== currentId &&
        s.industries.some((i) => current.industries.includes(i))
    )
    .slice(0, 3);

  if (!matches.length) return null;

  return (
    <div className="space-y-2 mt-6">
      <p className="text-xs font-semibold">You may also like</p>

      {matches.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="block w-full text-left rounded-md border px-2 py-2 hover:bg-muted"
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
