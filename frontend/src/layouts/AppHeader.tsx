import { ModeToggle } from "../components/mode-toggle";

export const AppHeader = () => {
  return (
    <header className=" border-b">
      <div className="flex items-center align-middle border justify-between p-4 rounded-2xl m-4">
        <h1 className="text-xl font-bold">AI Interview Assistant</h1>
        <ModeToggle />
      </div>
    </header>
  );
};
