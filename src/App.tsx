import { useState } from "react";
import Globe from "./Globe";
import { companies } from "./data/locations";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

function App() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = companies.find((c) => c.id === selectedId);

  return (
    <div className="relative w-screen h-screen">
      <Globe
        onMarkerClick={(id) => {
          setSelectedId(id);
          setOpen(true);
        }}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{selected?.name ?? "Company"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-medium">Hiring History</p>
              <ul className="mt-2 space-y-1">
                {selected?.jobs.map((job, idx) => (
                  <li key={idx} className="text-slate-600">
                    {job.title} — {job.year}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default App;
