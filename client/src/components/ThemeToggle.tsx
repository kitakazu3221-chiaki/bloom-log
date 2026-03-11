import { useTheme } from "../hooks/useTheme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`w-9 h-9 flex items-center justify-center rounded-lg bg-secondary border border-theme text-theme-muted hover:text-theme-secondary transition-colors ${className}`}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className="text-base">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
