import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

interface FilterBarProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export default function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
    const [categories, setCategories] = useState<string[]>(["Alle"]);

    useEffect(() => {
        fetch(`${API_URL}/tags/`)
            .then(res => res.json())
            .then((data: string[]) => {
                // Ensure "Alle" is first, then sorted tags
                setCategories(["Alle", ...data.sort()]);
            })
            .catch(err => console.error("Failed to fetch tags for filter", err));
    }, []);

    return (
        <div className="flex flex-wrap gap-4 md:gap-8 border-b border-gray-200 dark:border-gray-700 pb-2 mb-8 overflow-x-auto whitespace-nowrap">
            {categories.map((category) => {
                const isActive = activeFilter === category || (category === "Alle" && activeFilter === "");

                return (
                    <button
                        key={category}
                        onClick={() => onFilterChange(category === "Alle" ? "" : category)}
                        className={`text-sm md:text-base font-semibold transition-colors pb-2 relative 
                            ${isActive ? 'text-omf-cyan' : 'text-gray-600 hover:text-omf-dark dark:text-gray-400 dark:hover:text-gray-200'}
                        `}
                    >
                        {category}
                        {isActive && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-omf-cyan rounded-t-sm" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
