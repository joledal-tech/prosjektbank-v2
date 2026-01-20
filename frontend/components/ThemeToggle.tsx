"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
            <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-full transition-all ${theme === "light"
                        ? "bg-gray-100 text-omf-cyan shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    }`}
                aria-label="Light mode"
            >
                <SunIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-full transition-all ${theme === "dark"
                        ? "bg-gray-700 text-yellow-400 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                aria-label="Dark mode"
            >
                <MoonIcon className="h-5 w-5" />
            </button>
        </div>
    );
}
