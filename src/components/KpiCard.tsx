import { ReactNode, useEffect, useRef, useState } from "react";
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
  hero?: boolean;
}

function AnimatedNumber({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    // Extract numeric part
    const clean = value.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = parseFloat(clean);
    const prevClean = prevRef.current.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const prevNum = parseFloat(prevClean);

    if (isNaN(num) || isNaN(prevNum)) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const prefix = value.match(/^[^0-9]*/)?.[0] || "";
    const suffix = value.match(/[^0-9.,]*$/)?.[0] || "";

    let frame = 0;
    const totalFrames = 30;
    const step = (num - prevNum) / totalFrames;

    const animate = () => {
      frame++;
      const current = prevNum + step * frame;
      const formatted = Math.round(current).toLocaleString("es-CL");
      setDisplay(`${prefix}${formatted}${suffix}`);

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    if (Math.abs(num - prevNum) > 0) {
      requestAnimationFrame(animate);
    } else {
      setDisplay(value);
    }

    prevRef.current = value;
  }, [value]);

  return <>{display}</>;
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
  hero = false,
}: KpiCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--mouse-x", `${x}%`);
    cardRef.current.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      className={`card-glow relative ${hero ? "row-span-2" : ""}`}
    >
      {/* Top gradient line */}
      <div
        className="absolute top-0 left-4 right-4 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(${accentColor} / 0.5), transparent)`,
        }}
      />

      <div className={`relative p-5 ${hero ? "p-7" : ""}`}>
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-2.5 rounded-xl transition-all duration-500 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, hsl(${accentColor} / 0.15), hsl(${accentColor} / 0.05))`,
              color: `hsl(${accentColor})`,
              boxShadow: `0 0 20px hsl(${accentColor} / 0.1)`,
            }}
          >
            {icon}
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm ${
                trend === "up"
                  ? "text-[hsl(152,69%,45%)] bg-[hsl(152,69%,45%,0.12)]"
                  : trend === "down"
                  ? "text-[hsl(0,72%,51%)] bg-[hsl(0,72%,51%,0.12)]"
                  : "text-muted-foreground bg-muted/50"
              }`}
            >
              {trend === "up" && <TrendingUp className="w-3 h-3" />}
              {trend === "down" && <TrendingDown className="w-3 h-3" />}
              {trend === "neutral" && <Minus className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>

        <p className={`font-bold text-foreground tracking-tight number-display leading-none ${hero ? "text-[42px]" : "text-[28px]"}`}>
          <AnimatedNumber value={value} />
        </p>
        <p className={`font-medium text-muted-foreground ${hero ? "text-sm mt-3" : "text-xs mt-2"}`}>{title}</p>
        {subtitle && (
          <p className={`text-muted-foreground/40 mt-1 ${hero ? "text-xs" : "text-[10px]"}`}>{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;
