'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetch(`http://localhost:8000/employees/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setEmployee(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [params.id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Laster...</div>;
    if (!employee) return <div className="p-8 text-center text-red-500">Ikke funnet.</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-8 max-w-4xl mx-auto border border-gray-100 dark:border-gray-700">
            {/* Top Actions */}
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => router.back()} className="text-gray-500 dark:text-gray-400 hover:text-omf-cyan transition-colors flex items-center gap-1">
                    <span className="text-xl">&larr;</span> Tilbake
                </button>
                <Link
                    href={`/cv-bank/${employee.id}/cv`}
                    className="px-6 py-2.5 bg-omf-cyan hover:bg-opacity-90 rounded-xl text-sm font-black text-white transition-all shadow-lg shadow-omf-cyan/20 active:scale-95 flex items-center gap-2 uppercase tracking-tight"
                >
                    Se CV
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
                {/* Left Column: Image and Contact */}
                <div className="md:w-1/3 flex flex-col items-center">
                    <div className="w-56 h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full overflow-hidden mb-6 border-4 border-white dark:border-gray-600 shadow-xl flex items-center justify-center relative">
                        {employee.image_url ? (
                            <img src={employee.image_url} alt={employee.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-6xl text-gray-400 dark:text-gray-500 font-bold">{employee.name.charAt(0)}</span>
                        )}
                    </div>

                    <h1 className="text-3xl font-black text-omf-dark dark:text-white mb-1 text-center uppercase tracking-tight">{employee.name}</h1>
                    <p className="text-omf-cyan font-black uppercase tracking-widest mb-1 text-center text-sm">{employee.title || 'Ansatt'}</p>
                    {employee.company && (
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase mb-6 text-center tracking-wide">{employee.company}</p>
                    )}

                    <div className="w-full mt-4 space-y-4 text-left bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b dark:border-gray-800 pb-2 mb-4">Kontaktinfo</h3>
                        {employee.email && (
                            <div>
                                <label className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Epost</label>
                                <div className="text-gray-800 dark:text-gray-200 font-bold break-all text-sm">{employee.email}</div>
                            </div>
                        )}
                        {employee.phone && (
                            <div>
                                <label className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">Telefon</label>
                                <div className="text-gray-800 dark:text-gray-200 font-bold text-sm">{employee.phone}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Projects */}
                <div className="md:w-2/3 space-y-8">
                    <section>
                        <h2 className="text-xl font-black uppercase text-omf-dark dark:text-white border-l-4 border-omf-lime pl-4 mb-6 tracking-tight">Prosjekter</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {employee.team_memberships && employee.team_memberships.length > 0 ? (
                                employee.team_memberships.map((membership: any) => (
                                    <Link
                                        key={membership.id}
                                        href={`/project/${membership.project_id}`}
                                        className="block p-5 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:border-omf-cyan hover:shadow-xl hover:shadow-omf-cyan/5 transition-all transform hover:-translate-y-1 group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-omf-dark dark:text-white group-hover:text-omf-cyan transition-colors">
                                                    {membership.project.name}
                                                </h3>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2 font-bold uppercase tracking-wide mt-1">
                                                    <span>{membership.project.type}</span>
                                                    <span>•</span>
                                                    <span>{membership.project.location}</span>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-[10px] font-black text-omf-cyan uppercase tracking-wider">
                                                {membership.role}
                                            </span>
                                        </div>
                                        {membership.project.time_frame && (
                                            <div className="mt-4 text-[10px] text-gray-400 font-mono flex items-center gap-2">
                                                <span className="w-4 h-[1px] bg-gray-300 dark:bg-gray-700"></span>
                                                {membership.project.time_frame}
                                            </div>
                                        )}
                                    </Link>
                                ))
                            ) : (
                                <div className="text-gray-400 italic text-sm p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    Ingen prosjekter registrert.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
