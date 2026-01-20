'use client';
import { API_URL, getStaticUrl } from '@/lib/api';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import ThemeToggle from '../../components/ThemeToggle';
import CVIngestionModal from '../../components/CVIngestionModal';

interface Employee {
    id: number;
    name: string;
    title: string;
    email: string;
    phone: string;
    image_url?: string;
}

export default function CVBankIndex() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchEmployees = () => {
        fetch(`${API_URL}/employees/`)
            .then((res) => res.json())
            .then((data) => {
                setEmployees(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch employees', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    if (loading) return <div className="text-center mt-10 text-white">Laster CV-bank...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold uppercase text-omf-dark dark:text-white">CV-bank</h2>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-omf-cyan text-white px-4 py-2 rounded-sm shadow hover:bg-opacity-90 flex items-center gap-2 font-semibold transition-all"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Importer CV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {employees.map((employee) => (
                    <Link key={employee.id} href={`/cv-bank/${employee.id}`}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1 group">
                            <div className="h-48 bg-gray-200 dark:bg-gray-700 w-full relative">
                                {employee.image_url ? (
                                    <img
                                        src={employee.image_url.startsWith('http') ? employee.image_url : `${API_URL}${employee.image_url}`}
                                        alt={employee.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <UserIcon className="h-20 w-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-omf-dark opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            </div>

                            <div className="p-4">
                                <h3 className="text-xl font-bold text-omf-dark dark:text-gray-100 mb-1">{employee.name}</h3>
                                <p className="text-omf-cyan font-semibold text-sm mb-4 uppercase tracking-wider">{employee.title}</p>

                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="h-4 w-4 text-omf-lime" />
                                        {employee.email || 'Ingen e-post'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon className="h-4 w-4 text-omf-lime" />
                                        {employee.phone || 'Ingen tlf'}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <span className="text-omf-cyan font-bold uppercase text-xs tracking-widest group-hover:underline">Se detaljer &rarr;</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {employees.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600">
                        Ingen ansatte funnet i CV-banken. Begynn med å importere en CV!
                    </div>
                )}
            </div>

            <CVIngestionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchEmployees();
                }}
            />
        </div>
    );
}
