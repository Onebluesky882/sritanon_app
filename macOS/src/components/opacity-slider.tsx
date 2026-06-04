import { useTheme } from "@/components/theme-provider";
import { Slider } from "@/components/ui/slider";

export function OpacitySlider() {
  const { opacity, setOpacity } = useTheme();

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <span className="text-xs text-muted-foreground">Opacity</span>

      <Slider
        value={[opacity]}
        min={0.2}
        max={1}
        step={0.01}
        onValueChange={(value) => setOpacity(value[0])}
        className="w-24"
      />

      <span className="text-xs w-10 text-right">
        {Math.round(opacity * 100)}%
      </span>
    </div>
  );
}
