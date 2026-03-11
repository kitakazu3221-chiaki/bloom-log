import { useTheme } from "../hooks/useTheme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`text-sm font-medium text-theme-muted hover:text-theme-secondary bg-secondary border border-theme rounded-lg px-2.5 py-1 transition-colors ${className}`}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
