'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { ProjectPDF } from '../../../components/ProjectPDF';
import { PDFPreviewModal } from '../../../components/PDFPreviewModal';

// Removed PDFDownloadLink dynamic import in favor of manual handling

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Team Member State
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newTeamMember, setNewTeamMember] = useState({
        role: '',
        name: '',
        email: '',
        phone: '',
        title: '',
        company: ''
    });

    const submitTeamMember = async () => {
        setIsAddingMember(true);
        try {
            const res = await fetch(`http://localhost:8000/projects/${project.id}/team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: newTeamMember.role,
                    new_employee: {
                        name: newTeamMember.name,
                        email: newTeamMember.email,
                        phone: newTeamMember.phone,
                        title: newTeamMember.title,
                        company: newTeamMember.company
                    }
                })
            });

            if (res.ok) {
                const addedMember = await res.json();
                // Update local state
                setProject((prev: any) => ({
                    ...prev,
                    team_members: [...(prev.team_members || []), addedMember]
                }));
                setShowAddTeamModal(false);
                setNewTeamMember({ role: '', name: '', email: '', phone: '', title: '', company: '' });
            } else {
                alert('Kunne ikke legge til person.');
            }
        } catch (err) {
            console.error(err);
            alert('En feil oppstod.');
        } finally {
            setIsAddingMember(false);
        }
    };

    // PDF Options
    const [pdfOptions, setPdfOptions] = useState({
        showEconomy: true,
        showContact: true,
        showDescription: true,
        showRole: true,
        showRelevance: false,
        showChallenges: false,
    });

    const resolveImageUrl = (url: string) => {
        if (!url) return '';
        // If it starts with http, return as is
        if (url.startsWith('http')) return url;
        // If it starts with /static, return as is (proxied by Next.js)
        // BUT for react-pdf to work reliably, we might need full URL including origin.
        // Let's try relative first, as Next.js handles it. 
        // Actually, react-pdf needs absolute URLs usually. 
        // Let's us window.location.origin if available, or just relative.
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url}`;
        }
        return url;
    };

    useEffect(() => {
        if (params.id) {
            fetch(`http://localhost:8000/projects/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setProject(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [params.id]);

    const [pdfImages, setPdfImages] = useState<{ main: string | null; gallery: string[] }>({ main: null, gallery: [] });

    // Helper to fetch image and convert to base64
    const fetchImageAsBase64 = async (url: string) => {
        try {
            const resolvedUrl = resolveImageUrl(url);
            const response = await fetch(resolvedUrl);
            if (!response.ok) {
                console.error('Failed to fetch image:', response.status, response.statusText);
                return null;
            }
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result);
                };
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error fetching image for PDF:', error);
            return null;
        }
    };

    // Fetch images for PDF when project loads
    useEffect(() => {
        if (project) {
            const loadImages = async () => {
                // Logic matches the web view: prioritize image_url, fallback to images[0]
                const mainUrl = project.image_url || (project.images && project.images.length > 0 ? project.images[0].url : null);
                const galleryUrls = project.images?.map((img: any) => img.url) || [];

                // Fetch the main image (which might be the same as the first gallery image)
                const mainBase64 = mainUrl ? await fetchImageAsBase64(mainUrl) : null;
                const galleryBase64 = await Promise.all(galleryUrls.map((url: string) => fetchImageAsBase64(url)));

                setPdfImages({
                    main: mainBase64,
                    gallery: galleryBase64.filter((img): img is string => img !== null)
                });
            };
            loadImages();
        }
    }, [project]);

    const [pdfLayout, setPdfLayout] = useState('standard');
    const [selectedImageIndices, setSelectedImageIndices] = useState<Set<number>>(new Set());

    // Memoize the PDF project data to avoid constant regeneration
    const pdfProject = useMemo(() => {
        if (!project) return null;
        return {
            ...project,
            image_url: pdfImages.main || resolveImageUrl(project.image_url), // Fallback to URL if base64 not ready (though likely won't work if base64 needed)
            images: project.images?.map((img: any, index: number) => ({
                ...img,
                url: pdfImages.gallery[index] || resolveImageUrl(img.url)
            })) || []
        };
    }, [project, pdfImages]);

    if (loading) return <div>Laster...</div>;
    if (!project) return <div>Ikke funnet.</div>;

    const pdfFileName = project ? `${project.name.replace(/\s+/g, '_')}_referanse.pdf` : 'prosjekt.pdf';

    // Helper to get selected images for PDF
    const getSelectedImagesForPdf = () => {
        if (!pdfProject) return [];
        let selectedImgs: string[] = [];
        if (selectedImageIndices.size > 0 && pdfProject.images) {
            selectedImgs = Array.from(selectedImageIndices)
                .sort((a, b) => a - b)
                .map(idx => pdfProject.images[idx]?.url)
                .filter(Boolean);
        }
        return selectedImgs;
    };

    const handleDownloadPdf = async () => {
        if (!pdfProject) return;
        setIsGeneratingPdf(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const selectedImagesForPdf = getSelectedImagesForPdf();

            const blob = await pdf(
                <ProjectPDF
                    project={pdfProject}
                    options={pdfOptions}
                    layout={pdfLayout as any}
                    selectedImages={selectedImagesForPdf}
                />
            ).toBlob();

            // Ensure filename is valid and has .pdf extension
            const finalName = (pdfFileName && pdfFileName.endsWith('.pdf')) ? pdfFileName : 'prosjekt_referanse.pdf';
            console.log('Saving PDF as:', finalName);

            // Use file-saver to force download with correct name
            const { saveAs } = await import('file-saver');
            saveAs(blob, finalName);
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Kunne ikke generere PDF. Prøv igjen.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-8 max-w-6xl mx-auto border border-gray-100 dark:border-gray-700">
            {/* Top Actions */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => router.back()} className="text-gray-500 dark:text-gray-400 hover:underline">&larr; Tilbake</button>
                <div className="flex gap-4">
                    <Link
                        href={`/project/${project.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 from-neutral-50 shadow-sm transition-colors"
                    >
                        <PencilSquareIcon className="h-4 w-4" />
                        Rediger
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <h1 className="text-4xl font-bold uppercase text-omf-dark dark:text-white">{project.name}</h1>
                    <span className="inline-block bg-blue-50 text-omf-cyan px-3 py-1 rounded text-sm font-semibold tracking-wide uppercase">
                        {project.type}
                    </span>

                    {/* Tags Display */}
                    {project.tags && project.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {project.tags.map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded border border-gray-200 dark:border-gray-600">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-gray-400 italic">
                            Ingen emneknagger. <Link href={`/project/${project.id}/edit`} className="underline hover:text-omf-cyan">Legg til</Link>
                        </div>
                    )}

                    {/* Image - Natural Aspect Ratio */}
                    <div className="bg-gray-100 rounded overflow-hidden relative group min-h-[200px]">
                        {(project.images && project.images.length > 0) ? (
                            <img
                                src={resolveImageUrl(project.images[activeImageIndex]?.url || project.images[0].url)}
                                alt={project.name}
                                className="w-full h-auto object-contain max-h-[800px]"
                            />
                        ) : project.image_url ? (
                            <img src={project.image_url} alt={project.name} className="w-full h-auto object-contain max-h-[800px]" />
                        ) : (
                            <div className="w-full h-64 flex items-center justify-center text-gray-400">Ingen bilde</div>
                        )}

                        {/* Interactive Gallery Preview */}
                        {(project.images && project.images.length > 1) && (
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                {project.images.map((img: any, idx: number) => {
                                    if (idx > 4) return null; // Limit to 5 thumbs
                                    return (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                                            className={`w-16 h-10 border-2 rounded overflow-hidden shadow transition-transform hover:scale-105 ${activeImageIndex === idx ? 'border-omf-cyan' : 'border-white'}`}
                                        >
                                            <img
                                                src={resolveImageUrl(img.url)}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    );
                                })}
                                {project.images.length > 5 && (
                                    <div className="w-16 h-10 bg-black bg-opacity-50 text-white flex items-center justify-center text-xs font-bold border-2 border-white rounded">
                                        +{project.images.length - 5}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="prose max-w-none text-gray-700 dark:text-gray-300">
                        <h3 className="text-xl font-bold uppercase text-omf-dark dark:text-gray-100 border-b border-omf-lime pb-2 mb-4">Beskrivelse</h3>
                        <p className="whitespace-pre-wrap">{project.description || 'Ingen beskrivelse registrert.'}</p>
                    </div>

                    {project.role_description && (
                        <div className="prose max-w-none text-gray-700 dark:text-gray-300 mt-8">
                            <h3 className="text-xl font-bold uppercase text-omf-dark dark:text-gray-100 border-b border-omf-lime pb-2 mb-4">Firmaets rolle i prosjektet</h3>
                            <p className="whitespace-pre-wrap">{project.role_description}</p>
                        </div>
                    )}

                    {/* ØMF-Team Section */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center border-b border-omf-lime pb-2 mb-4">
                            <h3 className="text-xl font-bold uppercase text-omf-dark dark:text-gray-100">ØMF-Team</h3>
                            <button
                                onClick={() => setShowAddTeamModal(true)}
                                className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 px-3 py-1 rounded text-omf-dark dark:text-gray-200"
                            >
                                + Legg til person
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.team_members && project.team_members.map((member: any) => (
                                <div key={member.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded border border-gray-100 dark:border-gray-600">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xl overflow-hidden">
                                        {member.employee?.image_url ?
                                            <img src={member.employee.image_url} className="w-full h-full object-cover" /> :
                                            <span>{member.employee?.name?.charAt(0)}</span>
                                        }
                                    </div>
                                    <div>
                                        <Link href={`/cv-bank/${member.employee_id}`} className="font-bold text-omf-dark dark:text-white hover:text-omf-cyan hover:underline">
                                            {member.employee?.name}
                                        </Link>
                                        <div className="text-sm text-omf-cyan font-semibold uppercase">{member.role}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {member.employee?.email && <div>{member.employee.email}</div>}
                                            {member.employee?.phone && <div>{member.employee.phone}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!project.team_members || project.team_members.length === 0) && (
                                <div className="text-gray-500 text-sm italic col-span-2">
                                    Ingen personer lagt til i teamet ennå.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar / Facts */}
                <div className="space-y-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded border border-gray-100 dark:border-gray-600">
                        <h3 className="text-lg font-bold text-omf-dark dark:text-gray-100 mb-4 border-b dark:border-gray-600 pb-2">Prosjektfakta</h3>

                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Sted</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">{project.location}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Tidspunkt</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">{project.time_frame}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Areal</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">{project.area_m2?.toLocaleString('no-NO')} m²</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Kontraktsverdi</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">{project.contract_value_mnok} MNOK</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Entreprise</dt>
                                <dd className="font-medium text-gray-900 dark:text-gray-200">{project.contract_type}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Utført av</dt>
                                <dd className="font-medium text-right text-gray-900 dark:text-gray-200">{project.performed_by}</dd>
                            </div>

                            {/* New Contact Fields */}
                            {(project.client) && (
                                <div className="flex justify-between border-t border-gray-100 dark:border-gray-600 pt-2 mt-2">
                                    <dt className="text-gray-500 dark:text-gray-400">Byggherre</dt>
                                    <dd className="font-medium text-right text-gray-900 dark:text-gray-200">{project.client}</dd>
                                </div>
                            )}
                            {(project.contact_person) && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Kontaktperson</dt>
                                    <dd className="font-medium text-right text-gray-900 dark:text-gray-200">{project.contact_person}</dd>
                                </div>
                            )}
                            {(project.contact_phone) && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Telefon</dt>
                                    <dd className="font-medium text-right text-gray-900 dark:text-gray-200">{project.contact_phone}</dd>
                                </div>
                            )}
                            {(project.contact_email) && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Epost</dt>
                                    <dd className="font-medium text-right break-all ml-4 text-gray-900 dark:text-gray-200">{project.contact_email}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* PDF Generation Controls */}
                    <div className="bg-omf-dark text-white p-6 rounded shadow-lg">
                        <h3 className="text-lg font-bold mb-4 text-omf-cyan">Lag Referanseark (PDF)</h3>

                        {/* Layout Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Velg Layout</label>
                            <select
                                value={pdfLayout}
                                onChange={(e) => setPdfLayout(e.target.value)}
                                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-omf-cyan"
                            >
                                <option value="standard">Standard (Sidepanel)</option>
                                <option value="standard_old">Standard - gammel farge</option>
                                <option value="standard_single_image">Standard - ett bilde</option>
                                <option value="standard_2">Standard 2 - to kolonner</option>
                                <option value="standard_3">Standard 3 - breddeformat</option>
                                <option value="bottomHeavy">Oppe og nede</option>
                                <option value="twoColumn">To Kolonner (50/50)</option>
                                <option value="gallery">Bildegalleri</option>
                            </select>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pdfOptions.showEconomy}
                                    onChange={(e) => setPdfOptions({ ...pdfOptions, showEconomy: e.target.checked })}
                                    className="accent-omf-cyan"
                                />
                                Vis Økonomi (MNOK)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pdfOptions.showContact}
                                    onChange={(e) => setPdfOptions({ ...pdfOptions, showContact: e.target.checked })}
                                    className="accent-omf-cyan"
                                />
                                Vis Byggherreinfo
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pdfOptions.showDescription}
                                    onChange={(e) => setPdfOptions({ ...pdfOptions, showDescription: e.target.checked })}
                                    className="accent-omf-cyan"
                                />
                                Vis Beskrivelse
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pdfOptions.showRelevance}
                                    onChange={(e) => setPdfOptions({ ...pdfOptions, showRelevance: e.target.checked })}
                                    className="accent-omf-cyan"
                                />
                                Vis Relevans
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pdfOptions.showRole}
                                    onChange={(e) => setPdfOptions({ ...pdfOptions, showRole: e.target.checked })}
                                    className="accent-omf-cyan"
                                />
                                Vis Firmaets rolle
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pdfOptions.showChallenges}
                                    onChange={(e) => setPdfOptions({ ...pdfOptions, showChallenges: e.target.checked })}
                                    className="accent-omf-cyan"
                                />
                                Vis Utfordringer
                            </label>
                        </div>

                        <div className="flex gap-2">
                            {/* Preview Button */}
                            <button
                                onClick={() => setShowPreview(true)}
                                disabled={!pdfProject}
                                className="flex-1 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <EyeIcon className="w-5 h-5" />
                                Vis
                            </button>

                            {/* Download Button */}
                            <button
                                onClick={handleDownloadPdf}
                                disabled={isGeneratingPdf || !pdfProject}
                                className="flex-1 py-3 bg-omf-lime text-omf-dark font-bold rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingPdf ? 'Lagrer...' : 'Last ned'}
                            </button>
                        </div>
                    </div>

                    {/* Image Selection Info */}
                    {(project.images && project.images.length > 0) && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-100 dark:border-gray-600 mt-6">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Velg bilder til PDF:</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                Klikk på sirkelen over bildene i galleriet for å velge dem. Hvis ingen velges, brukes hovedbildet.
                            </p>

                            <div className="grid grid-cols-4 gap-2">
                                {project.images.map((img: any, idx: number) => (
                                    <div key={idx} className="relative group aspect-square">
                                        <img
                                            src={resolveImageUrl(img.url)}
                                            className={`w-full h-full object-cover rounded border-2 ${activeImageIndex === idx ? 'border-omf-cyan' : 'border-transparent'}`}
                                            onClick={() => setActiveImageIndex(idx)}
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newSet = new Set(selectedImageIndices);
                                                if (newSet.has(idx)) {
                                                    newSet.delete(idx);
                                                } else {
                                                    newSet.add(idx);
                                                }
                                                setSelectedImageIndices(newSet);
                                            }}
                                            className={`absolute top-1 right-1 w-6 h-6 rounded-full border border-white flex items-center justify-center shadow-sm ${selectedImageIndices.has(idx) ? 'bg-omf-cyan text-white' : 'bg-gray-800/50 text-transparent hover:bg-gray-800/80'}`}
                                        >
                                            ✓
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && pdfProject && (
                <PDFPreviewModal
                    project={pdfProject}
                    options={pdfOptions}
                    selectedImages={getSelectedImagesForPdf()}
                    onClose={() => setShowPreview(false)}
                    initialLayout={pdfLayout}
                />
            )}

            {/* Add Team Member Modal */}
            {showAddTeamModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-omf-dark dark:text-white">Legg til person i teamet</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Rolle</label>
                                <select
                                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newTeamMember.role}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                                >
                                    <option value="">Velg rolle...</option>
                                    <option value="Prosjektleder">Prosjektleder</option>
                                    <option value="Anleggsleder">Anleggsleder</option>
                                    <option value="Formann">Formann</option>
                                    <option value="Assisterende prosjektleder">Assisterende prosjektleder</option>
                                    <option value="Prosjektingeniør">Prosjektingeniør</option>
                                    <option value="HMS-leder">HMS-leder</option>
                                    <option value="Kalkulatør">Kalkulatør</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Navn</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newTeamMember.name}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                                    placeholder="F.eks. Ola Nordmann"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Stilling (Permanent)</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newTeamMember.title}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, title: e.target.value })}
                                    placeholder="F.eks. Daglig leder (Valgfritt)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Selskap</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newTeamMember.company}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, company: e.target.value })}
                                    placeholder="F.eks. ØMF Wito (Valgfritt)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 dark:text-gray-300">E-post</label>
                                <input
                                    type="email"
                                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newTeamMember.email}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                                    placeholder="navn@omfjeld.no"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Telefon</label>
                                <input
                                    type="tel"
                                    className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newTeamMember.phone}
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, phone: e.target.value })}
                                    placeholder="+47 900 00 000"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowAddTeamModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={submitTeamMember}
                                disabled={isAddingMember || !newTeamMember.role || !newTeamMember.name}
                                className="px-4 py-2 bg-omf-cyan text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                            >
                                {isAddingMember ? 'Lagrer...' : 'Legg til'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
