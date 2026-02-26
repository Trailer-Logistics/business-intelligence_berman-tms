import { useState } from "react";

interface TimeFilterProps {
  onFilterChange: (filter: string) => void;
}

const TimeFilter = ({ onFilterChange }: TimeFilterProps) => {
  const [active, setActive] = useState("mes");
  const filters = [
    { key: "7d", label: "7D" },
    { key: "mes", label: "Mes" },
    { key: "año", label: "Año" },
  ];

  return (
    <div className="flex gap-1">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => { setActive(f.key); onFilterChange(f.key); }}
          className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
            active === f.key
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
};

export default TimeFilter;
