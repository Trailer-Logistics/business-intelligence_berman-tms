import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: ReactNode;
  subtitle?: string;
  accentColor?: string;
  index?: number;
}

const KpiCard = ({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  subtitle,
  accentColor = "191 100% 50%",
  index = 0,
}: KpiCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-xl border border-[hsl(222,25%,15%)] hover:border-[hsl(191,100%,50%,0.2)] transition-all duration-500"
      style={{
        background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))",
      }}
    >
      {/* Hover glow overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, hsl(${accentColor} / 0.06) 0%, transparent 60%)`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(${accentColor}), transparent)`,
        }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{
              background: `hsl(${accentColor} / 0.1)`,
              color: `hsl(${accentColor})`,
            }}
          >
            {icon}
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${
                trend === "up"
                  ? "text-[hsl(152,69%,45%)] bg-[hsl(152,69%,45%,0.1)]"
                  : trend === "down"
                  ? "text-destructive bg-destructive/10"
                  : "text-muted-foreground bg-muted"
              }`}
            >
              {trend === "up" && <TrendingUp className="w-3 h-3" />}
              {trend === "down" && <TrendingDown className="w-3 h-3" />}
              {trend === "neutral" && <Minus className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>

        <p className="text-[26px] font-bold text-foreground tracking-tight number-display leading-none">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-2">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground/50 mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;
