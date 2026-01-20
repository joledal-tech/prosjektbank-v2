'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, MapPinIcon, CalendarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import FilterBar from '../components/FilterBar';
import ThemeToggle from '../components/ThemeToggle';

interface Project {
  id: number;
  name: string;
  type: string;
  location: string;
  time_frame: string;
  image_url: string;
  images?: { url: string }[];
  contract_type?: string;
  tags?: string[];
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/projects/')
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch projects', err);
        setLoading(false);
      });
  }, []);

  // Filter Logic
  // Filter Logic
  const filteredProjects = projects.filter((project) => {
    if (!activeFilter) return true;

    // Filter by TAGS
    // We check if the project has the active filter in its tags list
    // The tags from backend are strings, e.g. ["Barnehage", "Offentlig"]
    if (project.tags && Array.isArray(project.tags)) {
      return project.tags.includes(activeFilter);
    }

    return false;
  });

  if (loading) return <div className="text-center mt-10">Laster prosjekter...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold uppercase text-omf-dark dark:text-white">Alle Prosjekter</h2>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/project/new"
            className="bg-omf-cyan text-white px-4 py-2 rounded-sm shadow hover:bg-opacity-90 flex items-center gap-2 font-semibold"
          >
            <PlusIcon className="h-5 w-5" />
            Nytt Prosjekt
          </Link>
        </div>
      </div>

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
            {/* Placeholder image if no image_url */}
            <div className="h-48 bg-gray-200 dark:bg-gray-700 w-full object-cover flex items-center justify-center text-gray-500 dark:text-gray-400 overflow-hidden">
              {(project.images && project.images.length > 0) ? (
                <img
                  src={project.images[0].url.startsWith('http') ? project.images[0].url : `http://localhost:8000${project.images[0].url}`}
                  alt={project.name}
                  className="h-full w-full object-cover"
                />
              ) : project.image_url ? (
                <img src={project.image_url} alt={project.name} className="h-full w-full object-cover" />
              ) : (
                <span>Ingen bilde</span>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-omf-cyan bg-blue-50 px-2 py-1 rounded">
                  {project.type}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-omf-dark dark:text-gray-100">{project.name}</h3>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-omf-lime" />
                  {project.location}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-omf-lime" />
                  {project.time_frame || 'Tid ikke angitt'}
                </div>
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-omf-lime" />
                  {project.contract_type || 'Ukjent entreprise'}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <Link href={`/project/${project.id}`} className="text-omf-cyan font-bold uppercase text-sm hover:underline tracking-wide">
                  Se detaljer &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600">
            Ingen prosjekter funnet for dette filteret.
          </div>
        )}
      </div>
    </div>
  );
}
