import { forwardRef } from "react";
import {
  Building2,
  Briefcase,
  Layers,
  MapPin,
} from "lucide-react";

type ResultItemProps = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  active: boolean;
  onClick: () => void;
};

export const ResultItem = forwardRef<
  HTMLButtonElement,
  ResultItemProps
>(function ResultItem(
  { title, subtitle, icon, badge, active, onClick },
  ref
) {
  return (
    <button
      role="option"
      aria-selected={active}
      ref={ref}
      onClick={onClick}
      className={`
        w-full px-4 py-4 min-h-11 flex items-center gap-3 text-left
        transition
        ${active ? "bg-muted" : "hover:bg-muted"}
      `}
    >
      {icon}

      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>

      {badge && (
        <span className="
          rounded-full bg-emerald-500/10
          px-2 py-0.5 text-xs font-medium
          text-emerald-600
        ">
          {badge}
        </span>
      )}
    </button>
  );
});

export function ResultIcon({
  type,
}: {
  type: "startup" | "job" | "industry" | "location";
}) {
  const className = "h-4 w-4 text-muted-foreground shrink-0";

  switch (type) {
    case "startup":
      return <Building2 className={className} />;
    case "job":
      return <Briefcase className={className} />;
    case "industry":
      return <Layers className={className} />;
    case "location":
      return <MapPin className={className} />;
  }
}
