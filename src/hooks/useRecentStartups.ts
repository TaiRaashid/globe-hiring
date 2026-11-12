import { useState } from "react";

export function useRecentStartups(limit = 5) {
  const [recent, setRecent] = useState<string[]>([]);

  function add(id: string) {
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)];
      return next.slice(0, limit);
    });
  }

  return { recent, add };
}
