import { OpacitySlider } from "@/components/opacity-slider";
import { ModeToggle } from "../components/mode-toggle";

export const AppHeader = () => {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between p-4 m-4 rounded-2xl border bg-accent">
        <h1 className="text-xl font-bold">AI Interview Assistant</h1>

        <div className="flex items-center gap-4">
          <OpacitySlider />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
