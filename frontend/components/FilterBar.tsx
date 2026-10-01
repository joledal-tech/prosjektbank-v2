
import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface Tag {
    id: number;
    name: string;
    category: string;
}

interface ProjectType {
    id: number;
    name: string;
}

export interface FilterState {
    type: string | null;
    tagCategory: string | null;
    tag: string | null;
    year: string;
    location: string;
    mnok: string;
    area: string;
}

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (newFilters: FilterState) => void;
    uniqueLocations: string[];
}

export default function FilterBar({ filters, onFilterChange, uniqueLocations }: FilterBarProps) {
    const [structuredTags, setStructuredTags] = useState<Tag[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);

    // UI State for collapsing sections
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        // Fetch Tags
        fetch(`${API_URL}/structured-tags/`)
            .then(res => res.json())
            .then((data: Tag[]) => {
                setStructuredTags(data);
                const cats = Array.from(new Set(data.map(t => t.category))).sort();
                setCategories(cats);
            })
            .catch(err => console.error("Failed to fetch tags", err));

        // Fetch Types
        fetch(`${API_URL}/types/`)
            .then(res => res.json())
            .then((data: ProjectType[]) => {
                // Filter out garbage types (empty or too long)
                const validTypes = data
                    .filter(t => t.name && t.name.length < 30)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setProjectTypes(validTypes);
            })
            .catch(err => console.error("Failed to fetch types", err));
    }, []);

    const updateFilter = (key: keyof FilterState, value: string | null) => {
        const newFilters = { ...filters, [key]: value };

        // If changing category, reset tag
        if (key === 'tagCategory') {
            newFilters.tag = null;
        }

        onFilterChange(newFilters);
    };

    const visibleTags = filters.tagCategory
        ? structuredTags.filter(t => t.category === filters.tagCategory)
        : [];

    const hasActiveFilters = filters.year || filters.location || filters.mnok || filters.area || filters.tagCategory || filters.tag;

    return (
        <div className="mb-0 space-y-4">

            {/* 1. Primary Filters: Project Types (Tabs) */}
            <div className="flex items-center justify-between border-b-2 border-gray-100 dark:border-gray-700 pb-1 relative">
                <div className="flex overflow-x-auto gap-2 no-scrollbar mask-gradient-right flex-1 pr-12 mr-4 items-center">
                    <button
                        onClick={() => updateFilter('type', null)}
                        className={`px-4 py-2 text-sm font-bold uppercase transition-colors border-b-2 -mb-1.5 whitespace-nowrap flex-shrink-0
                            ${!filters.type ? 'border-omf-cyan text-omf-cyan' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}
                        `}
                    >
                        Alle Typer
                    </button>
                    {projectTypes.map(t => (
                        <button
                            key={t.id}
                            onClick={() => updateFilter('type', filters.type === t.name ? null : t.name)}
                            className={`px-4 py-2 text-sm font-bold uppercase transition-colors border-b-2 -mb-1.5 whitespace-nowrap flex-shrink-0
                                ${filters.type === t.name ? 'border-omf-cyan text-omf-cyan' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}
                            `}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>

                {/* Toggle Advanced Filters */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors
                        ${showFilters || hasActiveFilters ? 'bg-omf-cyan text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}
                    `}
                >
                    <FunnelIcon className="h-4 w-4" />
                    <span>Filter</span>
                    {hasActiveFilters && (
                        <span className="bg-white text-omf-cyan text-xs px-1.5 rounded-full font-bold">!</span>
                    )}
                </button>
            </div>

            {/* 2. Collapsible Advanced Filters Section */}
            {showFilters && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">

                    {/* Drill-down Grid */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-gray-200 dark:border-gray-700">
                        {/* Year Search */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Byggeår</label>
                            <input
                                type="text"
                                placeholder="f.eks. 2023"
                                value={filters.year}
                                onChange={(e) => updateFilter('year', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 focus:ring-omf-cyan focus:border-omf-cyan"
                            />
                        </div>

                        {/* Location Dropdown */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sted / Region</label>
                            <select
                                value={filters.location}
                                onChange={(e) => updateFilter('location', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 focus:ring-omf-cyan focus:border-omf-cyan"
                            >
                                <option value="">Alle steder</option>
                                {uniqueLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Revenue (Simplified Range) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kontraktsverdi (MNOK)</label>
                            <select
                                value={filters.mnok}
                                onChange={(e) => updateFilter('mnok', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 focus:ring-omf-cyan focus:border-omf-cyan"
                            >
                                <option value="">Alle</option>
                                <option value="0-50">&lt; 50 MNOK</option>
                                <option value="50-100">50 - 100 MNOK</option>
                                <option value="100-500">100 - 500 MNOK</option>
                                <option value="500+">&gt; 500 MNOK</option>
                            </select>
                        </div>

                        {/* Area (Simplified Range) */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Areal (m²)</label>
                            <select
                                value={filters.area}
                                onChange={(e) => updateFilter('area', e.target.value)}
                                className="w-full text-sm border-gray-300 rounded px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 focus:ring-omf-cyan focus:border-omf-cyan"
                            >
                                <option value="">Alle</option>
                                <option value="0-1000">&lt; 1 000 m²</option>
                                <option value="1000-5000">1 000 - 5 000 m²</option>
                                <option value="5000-15000">5 000 - 15 000 m²</option>
                                <option value="15000+">&gt; 15 000 m²</option>
                            </select>
                        </div>
                    </div>

                    {/* Structured Tags Section */}
                    <div className="p-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Metoder og Kriterier</label>
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => updateFilter('tagCategory', null)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors
                                    ${!filters.tagCategory ? 'bg-omf-dark text-white border-omf-dark' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}
                                `}
                            >
                                Alle Kategorier
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => updateFilter('tagCategory', cat === filters.tagCategory ? null : cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors
                                        ${filters.tagCategory === cat ? 'bg-omf-cyan text-white border-omf-cyan' : 'bg-white text-gray-600 border-gray-300 hover:border-omf-cyan dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}
                                    `}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Tags */}
                        {filters.tagCategory && (
                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-700">
                                {visibleTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => updateFilter('tag', filters.tag === tag.name ? null : tag.name)}
                                        className={`px-3 py-1 rounded text-sm transition-colors border
                                            ${filters.tag === tag.name
                                                ? 'bg-omf-cyan text-white border-omf-cyan shadow-sm'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-omf-cyan dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'}
                                        `}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Active Filter Summary / Reset */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
                {(filters.type || filters.tag || filters.year || filters.location || filters.mnok || filters.area) && (
                    <>
                        <span className="text-gray-500 font-medium">Aktive filter:</span>
                        {filters.type && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Type: {filters.type}</span>}
                        {filters.year && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">År: {filters.year}</span>}
                        {filters.location && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">Sted: {filters.location}</span>}
                        {filters.mnok && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">MNOK: {filters.mnok}</span>}
                        {filters.area && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs">Areal: {filters.area}</span>}
                        {filters.tag && <span className="bg-omf-cyan/20 text-omf-dark px-2 py-0.5 rounded text-xs">Tag: {filters.tag}</span>}

                        <button
                            onClick={() => onFilterChange({
                                type: null, tagCategory: null, tag: null, year: '', location: '', mnok: '', area: ''
                            })}
                            className="text-red-500 hover:text-red-700 hover:underline ml-2 text-xs font-bold uppercase"
                        >
                            Nullstill alle
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
