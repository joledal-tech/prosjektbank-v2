'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmployeePDF } from '../../../../components/EmployeePDF';

export default function CompleteCVPage() {
    const params = useParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '', title: '', company: '', email: '', phone: '', cv_link: '', image_url: '',
        bio: '',
        languages: [] as string[],
        key_competencies: [] as string[],
        work_experiences: [] as any[],
        educations: [] as any[],
        certifications: [] as any[],
        team_memberships: [] as any[]
    });

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

    const openEditModal = () => {
        setEditForm({
            name: employee.name || '',
            title: employee.title || '',
            company: employee.company || '',
            email: employee.email || '',
            phone: employee.phone || '',
            cv_link: employee.cv_link || '',
            image_url: employee.image_url || '',
            bio: employee.bio || '',
            languages: [...(employee.languages || [])],
            key_competencies: [...(employee.key_competencies || [])],
            work_experiences: [...(employee.work_experiences || [])].map(({ employee, ...rest }) => rest),
            educations: [...(employee.educations || [])],
            certifications: [...(employee.certifications || [])],
            team_memberships: [...(employee.team_memberships || [])].map(({ project, employee, ...rest }) => rest)
        });
        setShowEditModal(true);
    };

    const saveEdit = async () => {
        try {
            const res = await fetch(`http://localhost:8000/employees/${employee.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                const updated = await res.json();
                setEmployee(updated);
                setShowEditModal(false);
            } else {
                alert('Kunne ikke lagre endringer.');
            }
        } catch (err) {
            console.error(err);
            alert('Feil ved lagring.');
        }
    };

    const addListItem = (field: string, template: any) => {
        setEditForm({
            ...editForm,
            [field]: [...(editForm as any)[field], template]
        });
    };

    const removeListItem = (field: string, index: number) => {
        const newList = [...(editForm as any)[field]];
        newList.splice(index, 1);
        setEditForm({ ...editForm, [field]: newList });
    };

    const updateListItem = (field: string, index: number, key: string, value: string) => {
        const newList = [...(editForm as any)[field]];
        newList[index] = { ...newList[index], [key]: value };
        setEditForm({ ...editForm, [field]: newList });
    };

    const generateBioWithAI = async () => {
        setIsGeneratingBio(true);
        try {
            const res = await fetch(`http://localhost:8000/employees/${employee.id}/generate-bio`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.bio) {
                setEditForm(prev => ({ ...prev, bio: data.bio }));
            }
        } catch (err) {
            console.error("Failed to generate bio", err);
            alert("Kunne ikke generere profiltekst. Sjekk at backend kjører.");
        } finally {
            setIsGeneratingBio(false);
        }
    };

    const resolveImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url}`;
        }
        return url;
    };

    const handleDownloadPdf = async () => {
        if (!employee) return;
        setIsGeneratingPdf(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const { saveAs } = await import('file-saver');

            const pdfEmployee = {
                ...employee,
                image_url: employee.image_url ? resolveImageUrl(employee.image_url) : null
            };

            const blob = await pdf(<EmployeePDF employee={pdfEmployee} />).toBlob();
            const fileName = `CV_${employee.name.replace(/\s+/g, '_')}.pdf`;
            saveAs(blob, fileName);
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Kunne ikke generere PDF. Prøv igjen.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Laster...</div>;
    if (!employee) return <div className="p-8 text-center text-red-500">Ikke funnet.</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-8 max-w-5xl mx-auto border border-gray-100 dark:border-gray-700">
            {/* Top Actions */}
            <div className="flex justify-between items-center mb-8 border-b dark:border-gray-700 pb-6">
                <div>
                    <button onClick={() => router.back()} className="text-gray-500 dark:text-gray-400 hover:text-omf-cyan transition-colors flex items-center gap-1 mb-2">
                        <span className="text-xl">&larr;</span> Tilbake
                    </button>
                    <h1 className="text-3xl font-black text-omf-dark dark:text-white uppercase tracking-tight">CV for {employee.name}</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={openEditModal}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        Rediger Profil
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        className="px-4 py-2 bg-omf-cyan hover:bg-opacity-90 rounded text-sm font-bold text-white transition-colors disabled:opacity-50 shadow-lg shadow-omf-cyan/20"
                    >
                        {isGeneratingPdf ? 'Genererer...' : 'Eksporter CV (PDF)'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Profile and Sidebar */}
                <div className="lg:col-span-1 space-y-8 text-gray-800 dark:text-gray-200 font-sans">
                    <div className="flex flex-col items-center">
                        <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg mb-4">
                            {employee.image_url ? (
                                <img src={employee.image_url} alt={employee.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-300">
                                    {employee.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold dark:text-white">{employee.name}</h2>
                            <p className="text-omf-cyan uppercase font-bold text-xs tracking-widest">{employee.title}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{employee.company}</p>
                        </div>
                    </div>

                    <section className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-black text-omf-cyan uppercase tracking-widest mb-4 border-b dark:border-gray-800 pb-2">Kontaktinfo</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-black">Epost</label>
                                <div className="font-medium">{employee.email || '-'}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase font-black">Telefon</label>
                                <div className="font-medium">{employee.phone || '-'}</div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-black text-omf-cyan uppercase tracking-widest mb-4 border-b dark:border-gray-800 pb-2">Utdanning</h3>
                        <div className="space-y-4">
                            {employee.educations?.map((edu: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                    <div className="text-[10px] text-omf-cyan font-bold">{edu.time_frame}</div>
                                    <div className="font-bold">{edu.institution}</div>
                                    <div className="text-gray-500 text-xs">{edu.degree}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-black text-omf-cyan uppercase tracking-widest mb-4 border-b dark:border-gray-800 pb-2">Språk</h3>
                        <div className="flex flex-wrap gap-2">
                            {employee.languages && employee.languages.length > 0 ? (
                                employee.languages.map((lang: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold">
                                        {lang}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 italic text-xs">Ingen språk registrert.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Profil / Bio */}
                    <section>
                        <h2 className="text-xl font-black uppercase text-omf-dark dark:text-white border-l-4 border-omf-lime pl-4 mb-4 tracking-tight">Profil</h2>
                        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {employee.bio || 'Ingen profiltekst registrert.'}
                        </div>
                    </section>

                    {/* Key Competencies */}
                    <section>
                        <h2 className="text-xl font-black uppercase text-omf-dark dark:text-white border-l-4 border-omf-lime pl-4 mb-4 tracking-tight">Nøkkelkompetanse</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {employee.key_competencies && employee.key_competencies.length > 0 ? (
                                employee.key_competencies.map((comp: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                        <span className="text-omf-cyan font-bold text-lg leading-none">•</span>
                                        <span>{comp}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 italic text-xs col-span-2">Ingen nøkkelkompetanse registrert.</p>
                            )}
                        </div>
                    </section>

                    {/* Work Experience */}
                    <section>
                        <h2 className="text-xl font-black uppercase text-omf-dark dark:text-white border-l-4 border-omf-lime pl-4 mb-6 tracking-tight">Arbeidserfaring</h2>
                        <div className="space-y-8">
                            {employee.work_experiences?.map((exp: any, idx: number) => (
                                <div key={idx} className="relative pl-6 border-l border-gray-200 dark:border-gray-700">
                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-omf-cyan"></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{exp.company}</h3>
                                        <span className="text-xs font-mono text-omf-cyan font-bold">{exp.time_frame}</span>
                                    </div>
                                    <p className="text-omf-cyan font-bold text-xs uppercase mb-2">{exp.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black uppercase text-omf-dark dark:text-white border-l-4 border-omf-lime pl-4 mb-6 tracking-tight">Kurs & Sertifikater</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {employee.certifications?.map((cert: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-sm font-semibold dark:text-gray-300">{cert.name}</span>
                                    <span className="text-xs font-black text-omf-cyan">{cert.year}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-black uppercase text-omf-dark dark:text-white border-l-4 border-omf-lime pl-4 mb-6 tracking-tight">Utvalgte Prosjekter</h2>
                        <div className="space-y-6">
                            {employee.team_memberships?.map((membership: any) => (
                                <div
                                    key={membership.id}
                                    className="p-6 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-omf-dark dark:text-white">{membership.project.name}</h3>
                                            <p className="text-xs text-omf-cyan font-bold uppercase tracking-wide">{membership.project.type} • {membership.project.location}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-omf-dark dark:text-gray-300 uppercase">{membership.role}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{membership.project.time_frame}</div>
                                        </div>
                                    </div>

                                    {membership.cv_relevance && (
                                        <div className="mb-4">
                                            <h4 className="text-[10px] font-black uppercase text-omf-cyan mb-1">Relevans</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{membership.cv_relevance}</p>
                                        </div>
                                    )}

                                    {membership.role_summary && (
                                        <div className="mb-4">
                                            <h4 className="text-[10px] font-black uppercase text-omf-cyan mb-1">Beskrivelse av rolle</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{membership.role_summary}</p>
                                        </div>
                                    )}

                                    {membership.reference_name && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-end">
                                            <div className="text-xs">
                                                <span className="text-gray-400 uppercase font-bold text-[9px] mr-2">Referanse:</span>
                                                <span className="font-bold">{membership.reference_name}</span>
                                                {membership.reference_phone && <span className="text-gray-500 ml-2">({membership.reference_phone})</span>}
                                            </div>
                                            <Link href={`/project/${membership.project_id}`} className="text-[10px] font-bold text-omf-cyan hover:underline">Se prosjektdetaljer &rarr;</Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <h3 className="text-2xl font-black text-omf-dark dark:text-white uppercase tracking-tight">Rediger Profil & CV</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-12">
                            {/* Basic Info */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-black text-omf-cyan uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-[2px] bg-omf-cyan"></span> Grunnleggende Info
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Navn</label>
                                        <input className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Stilling</label>
                                        <input className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Selskap</label>
                                        <input className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Epost</label>
                                        <input className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Bio / Profile */}
                                <section className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-black text-omf-cyan uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-6 h-[2px] bg-omf-cyan"></span> Profil / Introduksjon
                                        </h4>
                                        <button
                                            onClick={generateBioWithAI}
                                            disabled={isGeneratingBio}
                                            className="text-[10px] bg-omf-cyan/10 text-omf-cyan px-2 py-1 rounded font-bold hover:bg-omf-cyan/20 flex items-center gap-1 transition-colors disabled:opacity-50"
                                        >
                                            {isGeneratingBio ? (
                                                <>
                                                    <div className="w-2 h-2 border-2 border-omf-cyan border-t-transparent rounded-full animate-spin"></div>
                                                    Tenker...
                                                </>
                                            ) : (
                                                <>✨ Generer med AI</>
                                            )}
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none h-48 text-sm"
                                        placeholder="Fortell kort om din erfaring og kompetanse..."
                                        value={editForm.bio}
                                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                    />
                                </section>

                                {/* Key Competencies */}
                                <section className="space-y-4">
                                    <h4 className="text-sm font-black text-omf-cyan uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-6 h-[2px] bg-omf-cyan"></span> Nøkkelkompetanse
                                    </h4>
                                    <textarea
                                        className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none h-48 text-sm"
                                        placeholder="F.eks. Prosjektledelse, SHA, Betongarbeid... En per linje."
                                        value={editForm.key_competencies.join('\n')}
                                        onChange={e => setEditForm({ ...editForm, key_competencies: e.target.value.split('\n').filter(s => s.trim() !== '') })}
                                    />
                                </section>
                            </div>

                            {/* Languages */}
                            <section className="space-y-4">
                                <h4 className="text-sm font-black text-omf-cyan uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-[2px] bg-omf-cyan"></span> Språk
                                </h4>
                                <input
                                    className="w-full border-2 border-gray-100 p-3 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-omf-cyan outline-none"
                                    placeholder="F.eks. Norsk (Morsmål), Engelsk (Flytende). Separer med komma."
                                    value={editForm.languages.join(', ')}
                                    onChange={e => setEditForm({ ...editForm, languages: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                                />
                            </section>

                            <section className="space-y-4">
                                <h4 className="text-sm font-black text-omf-cyan uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-[2px] bg-omf-cyan"></span> Prosjektdetaljer på CV
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">Tilpass hvordan prosjektene dine presenteres på CV-en. Dette endrer ikke selve prosjektet, kun din referanse.</p>
                                <div className="space-y-8">
                                    {editForm.team_memberships.map((tm, idx) => {
                                        const projName = employee.team_memberships.find((m: any) => m.id === tm.id)?.project.name;
                                        return (
                                            <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <div className="font-bold text-omf-dark dark:text-white mb-4 border-b pb-2">{projName}</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-gray-400">Din rolle</label>
                                                        <input className="w-full border p-2 rounded text-sm dark:bg-gray-700" value={tm.role} onChange={e => updateListItem('team_memberships', idx, 'role', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase text-gray-400">Referanseperson (Navn og tlf)</label>
                                                        <div className="flex gap-2">
                                                            <input placeholder="Navn" className="flex-1 border p-2 rounded text-sm dark:bg-gray-700" value={tm.reference_name || ''} onChange={e => updateListItem('team_memberships', idx, 'reference_name', e.target.value)} />
                                                            <input placeholder="Tlf" className="flex-1 border p-2 rounded text-sm dark:bg-gray-700" value={tm.reference_phone || ''} onChange={e => updateListItem('team_memberships', idx, 'reference_phone', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-gray-400">CV-relevans (Hvorfor er dette relevant for tilbudet?)</label>
                                                    <textarea className="w-full border p-2 rounded text-sm dark:bg-gray-700 h-20" value={tm.cv_relevance || ''} onChange={e => updateListItem('team_memberships', idx, 'cv_relevance', e.target.value)} />
                                                </div>
                                                <div className="mt-4 space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-gray-400">Utfyllende beskrivelse av din rolle</label>
                                                    <textarea className="w-full border p-2 rounded text-sm dark:bg-gray-700 h-24" value={tm.role_summary || ''} onChange={e => updateListItem('team_memberships', idx, 'role_summary', e.target.value)} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Work Experience */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-black text-omf-cyan uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-6 h-[2px] bg-omf-cyan"></span> Arbeidserfaring
                                    </h4>
                                    <button
                                        onClick={() => addListItem('work_experiences', { company: '', title: '', time_frame: '', description: '' })}
                                        className="text-xs bg-omf-cyan bg-opacity-10 text-omf-cyan px-3 py-1.5 rounded-lg font-bold hover:bg-opacity-20"
                                    >
                                        + Legg til erfaring
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {editForm.work_experiences.map((exp, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl relative border border-gray-100 dark:border-gray-700 group">
                                            <button onClick={() => removeListItem('work_experiences', idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">&times;</button>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                <input placeholder="Selskap" className="border p-2 rounded text-sm dark:bg-gray-700" value={exp.company || ''} onChange={e => updateListItem('work_experiences', idx, 'company', e.target.value)} />
                                                <input placeholder="Tittel" className="border p-2 rounded text-sm dark:bg-gray-700" value={exp.title || ''} onChange={e => updateListItem('work_experiences', idx, 'title', e.target.value)} />
                                                <input placeholder="Tidsrom" className="border p-2 rounded text-sm dark:bg-gray-700" value={exp.time_frame || ''} onChange={e => updateListItem('work_experiences', idx, 'time_frame', e.target.value)} />
                                            </div>
                                            <textarea placeholder="Beskrivelse" className="w-full border p-2 rounded text-sm dark:bg-gray-700 h-20" value={exp.description || ''} onChange={e => updateListItem('work_experiences', idx, 'description', e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
                            <button onClick={() => setShowEditModal(false)} className="px-6 py-2 text-sm font-bold text-gray-500">Avbryt</button>
                            <button onClick={saveEdit} className="px-10 py-2 bg-omf-cyan text-white rounded-xl font-bold shadow-lg shadow-omf-cyan/20">Lagre CV</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
