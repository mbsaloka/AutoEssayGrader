"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "phosphor-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-all duration-300 ease-in-out
                 bg-surface hover:bg-surface-hover border border-border
                 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
                 focus:ring-offset-background group"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Sun Icon (visible in dark mode) */}
      <Sun
        className={`w-5 h-5 text-accent transition-all duration-300 ease-in-out transform
                    ${
                      theme === "dark"
                        ? "rotate-0 scale-100 opacity-100"
                        : "rotate-90 scale-0 opacity-0"
                    }
                    absolute inset-0 m-auto`}
        weight="bold"
      />

      {/* Moon Icon (visible in light mode) */}
      <Moon
        className={`w-5 h-5 text-accent transition-all duration-300 ease-in-out transform
                    ${
                      theme === "light"
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-90 scale-0 opacity-0"
                    }
                    absolute inset-0 m-auto`}
        weight="bold"
      />

      {/* Placeholder for sizing */}
      <div className="w-5 h-5 opacity-0">
        <Sun className="w-5 h-5" weight="bold" />
      </div>
    </button>
  );
}
