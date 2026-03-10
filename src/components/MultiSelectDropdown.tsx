import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Todos",
  className,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val]
    );
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-black bg-white px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 hover:border-black/70 transition-colors"
      >
        <span className="truncate text-left flex-1">
          {selected.length === 0
            ? placeholder
            : selected.length === 1
            ? selected[0]
            : `${selected.length} seleccionados`}
        </span>
        <div className="flex items-center gap-1 ml-1">
          {selected.length > 0 && (
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" onClick={clearAll} />
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] max-h-52 overflow-auto rounded-md border border-black bg-white text-black shadow-md animate-in fade-in-0 zoom-in-95">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Sin opciones</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-black hover:bg-black/5 transition-colors"
              >
                <div
                  className={cn(
                    "h-3.5 w-3.5 rounded-sm border border-input flex items-center justify-center",
                    selected.includes(opt) && "bg-primary border-primary"
                  )}
                >
                  {selected.includes(opt) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>
                <span className="truncate">{opt}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
