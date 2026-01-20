'use client';

import { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import FileDropzone from './FileDropzone';
import { XMarkIcon, PaperClipIcon, DocumentIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'; // For download/view

interface ProjectType {
    id: number;
    name: string;
}

interface ProjectFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function ProjectForm({ initialData, isEdit = false }: ProjectFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [types, setTypes] = useState<{ value: string; label: string }[]>([]);
    const [existingTags, setExistingTags] = useState<{ value: string; label: string }[]>([]);

    // Attachments State
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    useEffect(() => {
        if (initialData?.attachments) {
            setAttachments(initialData.attachments);
        }
    }, [initialData]);

    // Image State
    const [projectImages, setProjectImages] = useState<(File | string | null)[]>(Array(6).fill(null));

    // Initialize images from initialData
    useEffect(() => {
        if (initialData?.images && Array.isArray(initialData.images)) {
            const newImages: (File | string | null)[] = Array(6).fill(null);
            initialData.images.forEach((img: { url: string }, i: number) => {
                if (i < 6) {
                    newImages[i] = img.url;
                }
            });
            setProjectImages(newImages);
        }
    }, [initialData]);

    const onImageDrop = (acceptedFiles: File[], index: number) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const newImages = [...projectImages];
            newImages[index] = file;
            setProjectImages(newImages);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...projectImages];
        newImages[index] = null;
        setProjectImages(newImages);
    };

    // Helper component for a single image slot
    const ImageSlot = ({ index, image, onDrop, onRemove }: { index: number, image: File | string | null, onDrop: (files: File[], idx: number) => void, onRemove: (idx: number) => void }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop: (files) => onDrop(files, index),
            accept: { 'image/*': [] },
            maxFiles: 1,
            // disabled: !!image // Disable drop if image exists (must delete first, or allow replace? let's standard is delete to clear)
            // actually, standard dropzone behavior is often replace. But let's keep it simple.
            // If I disable it, I force them to delete. If I don't, dropping replaces.
            // Let's NOT disable, so they can replace easily.
        });

        const previewUrl = image instanceof File ? URL.createObjectURL(image) : (typeof image === 'string' ? image : null);

        // We need to stop propagation on the delete button so it doesn't trigger the dropzone
        const handleRemove = (e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove(index);
        }

        return (
            <div
                {...getRootProps()}
                className={`aspect-video rounded flex flex-col items-center justify-center transition cursor-pointer overflow-hidden relative
                ${isDragActive ? 'border-2 border-omf-cyan bg-blue-50' : 'border-2 border-dashed border-gray-300 hover:bg-gray-50 bg-gray-100'}
                `}
            >
                <input {...getInputProps()} />
                {previewUrl ? (
                    <div className="relative w-full h-full group">
                        <img
                            src={previewUrl.startsWith('http') || previewUrl.startsWith('blob:') ? previewUrl : `http://localhost:8000${previewUrl}`}
                            alt={`Bilde ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {/* Delete Button Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-red-600 transition-colors"
                                title="Fjern bilde"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className="text-3xl font-light text-gray-400 mb-1">+</span>
                        <span className="text-xs font-medium text-gray-500">Bilde {index + 1}</span>
                    </>
                )}
            </div>
        );
    };

    // Form State
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: initialData?.type || '',
        location: initialData?.location || '',
        time_frame: initialData?.time_frame || '',
        description: initialData?.description || '',
        role_description: initialData?.role_description || '',
        relevance: initialData?.relevance || '',
        challenges: initialData?.challenges || '', // Added challenges field
        relevance_role: initialData?.relevance_role || '',
        contract_type: initialData?.contract_type || '',
        performed_by: initialData?.performed_by || '',
        area_m2: initialData?.area_m2 || '',
        contract_value_mnok: initialData?.contract_value_mnok || '',
        certification: initialData?.certification || '',
        contact_person: initialData?.contact_person || '',
        contact_email: initialData?.contact_email || '',
        contact_phone: initialData?.contact_phone || '',
        image_url: initialData?.image_url || '',
        client: initialData?.client || '',
        tags: initialData?.tags || [],
    });

    // Fetch types and tags on mount
    useEffect(() => {
        fetch('http://localhost:8000/types/')
            .then(res => res.json())
            .then((data: ProjectType[]) => {
                setTypes(data.map(t => ({ value: t.name, label: t.name })));
            })
            .catch(err => console.error("Failed to fetch types", err));

        fetch('http://localhost:8000/tags/')
            .then(res => res.json())
            .then((data: string[]) => {
                setExistingTags(data.map(t => ({ value: t, label: t })));
            })
            .catch(err => console.error("Failed to fetch tags", err));
    }, []);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (newValue: any) => {
        setFormData(prev => ({ ...prev, type: newValue ? newValue.value : '' }));
    };

    const handleTagsChange = (newValue: any) => {
        // newValue is array of objects {value, label}
        const tags = newValue ? newValue.map((t: any) => t.value) : [];
        setFormData(prev => ({ ...prev, tags: tags }));
    };

    const handleFileUpload = async (file: File) => {
        setParsing(true);
        setUploadFeedback({ type: null, message: '' });
        const body = new FormData();
        body.append('file', file);

        try {
            // 1. Parse PDF
            const res = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: body
            });

            if (!res.ok) throw new Error("Parsing failed");

            const data = await res.json();

            // 2. Prepare Payload (Use parsed data + defaults + filename fallback)
            const projectPayload = {
                name: data.name || file.name.replace(/\.[^/.]+$/, ""), // Fallback to filename
                location: data.location || '',
                type: data.type || '',
                description: data.description || '',
                role_description: data.role_description || '',
                time_frame: data.time_frame || '',
                contract_type: data.contract_type || '',
                performed_by: data.performed_by || '',
                area_m2: data.area_m2 || 0,
                contract_value_mnok: data.contract_value_mnok || 0,
                client: data.client || '',
                certification: data.certification || '',
                contact_person: data.contact_person || '',
                contact_email: data.contact_email || '',
                contact_phone: data.contact_phone || '',
                image_url: data.image_url || '',
                tags: [] // Parser doesn't extract tags yet
            };

            // Handle extracted images
            let payloadImages = [];
            if (data.extracted_images && Array.isArray(data.extracted_images)) {
                // Update visual state (thumbnails)
                const extracted: string[] = data.extracted_images.map((path: string) => `http://localhost:8000${path}`);

                // Fill the slots with found images
                const newImages = [...projectImages];
                let fillIndex = 0;
                extracted.forEach(img => {
                    if (fillIndex < newImages.length) {
                        newImages[fillIndex] = img;
                        fillIndex++;
                    }
                });
                setProjectImages(newImages);

                // Also prepare for payload (we send the relative paths back to backend)
                // Or we could send absolute URLs, but backend expects what schema? 
                // Schema expects List[str]. Backend logic takes these strings and makes ProjectImage.
                // Ideally we keep the relative path from backend response or full URL.
                // Let's us the exact strings from data.extracted_images 
                payloadImages = data.extracted_images;
            }

            // 3. Create Project
            setUploadFeedback({ type: 'success', message: 'PDF analysert. Oppretter prosjekt...' });

            const createRes = await fetch('http://localhost:8000/projects/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...projectPayload,
                    images: payloadImages // Add images to creation payload
                }),
            });

            if (!createRes.ok) throw new Error("Creation failed");

            setUploadFeedback({ type: 'success', message: 'Prosjekt opprettet! Videresender...' });

            // 4. Redirect
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 1000);

        } catch (err) {
            console.error(err);
            setUploadFeedback({ type: 'error', message: 'Noe gikk galt. Prøv igjen eller fyll ut manuelt.' });
            setParsing(false); // Stop loading only on error
        }
    };


    // Upload Helper
    const uploadFile = async (file: File) => {
        if (!initialData?.id) return;
        setIsUploadingAttachment(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`http://localhost:8000/projects/${initialData.id}/attachments/`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const newAttachment = await res.json();
                setAttachments(prev => [...prev, newAttachment]);
            } else {
                alert('Kunne ikke laste opp vedlegg.');
            }
        } catch (error) {
            console.error(error);
            alert('Feil ved opplasting.');
        } finally {
            setIsUploadingAttachment(false);
        }
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        await uploadFile(e.target.files[0]);
        e.target.value = '';
    };

    // Attachment Dropzone
    const onAttachmentDrop = (acceptedFiles: File[]) => {
        acceptedFiles.forEach(file => {
            uploadFile(file);
        });
    };

    const {
        getRootProps: getAttRootProps,
        getInputProps: getAttInputProps,
        isDragActive: isAttDragActive
    } = useDropzone({
        onDrop: onAttachmentDrop,
        disabled: !isEdit,
        noClick: false // Click anywhere to open
    });

    const handleDeleteAttachment = async (id: number) => {
        if (!confirm('Er du sikker på at du vil slette dette vedlegget?')) return;

        try {
            const res = await fetch(`http://localhost:8000/attachments/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setAttachments(prev => prev.filter(a => a.id !== id));
            } else {
                alert('Kunne ikke slette vedlegg.');
            }
        } catch (error) {
            console.error(error);
            alert('Feil ved sletting.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const url = isEdit
            ? `http://localhost:8000/projects/${initialData.id}`
            : 'http://localhost:8000/projects/';

        const method = isEdit ? 'PUT' : 'POST';

        try {
            // Handle Image Uploads before saving
            const finalImages: string[] = [];

            for (const img of projectImages) {
                if (img instanceof File) {
                    // Upload new file
                    const formDataImg = new FormData();
                    formDataImg.append('file', img);

                    try {
                        const resImg = await fetch('http://localhost:8000/api/upload-image', {
                            method: 'POST',
                            body: formDataImg
                        });

                        if (resImg.ok) {
                            const dataImg = await resImg.json();
                            finalImages.push(dataImg.url);
                        } else {
                            console.error("Failed to upload image", await resImg.text());
                        }
                    } catch (e) {
                        console.error("Error uploading image", e);
                    }
                } else if (typeof img === 'string') {
                    // Existing URL
                    finalImages.push(img);
                }
            }

            // Prepare payload: convert empty strings to null for numbers
            const payload = {
                ...formData,
                area_m2: formData.area_m2 === '' ? null : Number(formData.area_m2),
                contract_value_mnok: formData.contract_value_mnok === '' ? null : Number(formData.contract_value_mnok),
                images: finalImages // Send the updated list of images
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to save project');

            router.push('/');
            router.refresh();
        } catch (err) {
            console.error(err);
            alert('Noe gikk galt under lagring av prosjektet.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!isEdit || !initialData?.id) return;

        if (!confirm('Er du sikker på at du vil slette dette prosjektet? Dette kan ikke angres.')) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/projects/${initialData.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete project');

            router.push('/');
            router.refresh();
        } catch (err) {
            console.error(err);
            alert('Noe gikk galt under sletting av prosjektet.');
            setLoading(false); // Reset loading if it fails so user isn't stuck
        }
    };

    const customStyles = {
        control: (provided: any) => ({
            ...provided,
            borderColor: '#e5e7eb', // gray-200
            '&:hover': { borderColor: '#d1d5db' }, // gray-300
            color: '#111827', // text-gray-900
        }),
        input: (provided: any) => ({
            ...provided,
            color: '#111827', // text-gray-900
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: '#111827', // text-gray-900
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#009DE0' : state.isFocused ? '#e0f2fe' : 'white',
            color: state.isSelected ? 'white' : '#011627',
        }),
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold uppercase mb-6 text-omf-dark dark:text-gray-100 border-b border-omf-lime pb-2">
                {isEdit ? 'Rediger Prosjekt' : 'Nytt Prosjekt'}
            </h2>

            {!isEdit && (
                <div className="mb-8">
                    <FileDropzone onFileAccepted={handleFileUpload} isLoading={parsing} />
                    {uploadFeedback.message && (
                        <div className={`mt-4 p-3 rounded text-sm font-medium ${uploadFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {uploadFeedback.message}
                        </div>
                    )}
                </div>
            )}

            {/* Image Placeholders */}
            <div className="mb-8">
                <h3 className="font-semibold text-lg text-gray-700 mb-3">Prosjektbilder (Maks 6)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {projectImages.map((img, i) => (
                        <ImageSlot key={i} index={i} image={img} onDrop={onImageDrop} onRemove={handleRemoveImage} />
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Bilder hentet fra PDF vises her automatisk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-700">Grunnleggende Info</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prosjektnavn</label>
                        <input
                            type="text" name="name" required value={formData.name} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type (Velg eller skriv ny)</label>
                        <CreatableSelect
                            instanceId="type-select"
                            isClearable
                            options={types}
                            onChange={handleTypeChange}
                            value={formData.type ? { value: formData.type, label: formData.type } : null}
                            placeholder="Velg type..."
                            styles={customStyles}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Emneknagger)</label>
                        <CreatableSelect
                            instanceId="tags-select"
                            isMulti
                            options={existingTags}
                            onChange={handleTagsChange}
                            value={formData.tags.map((t: string) => ({ value: t, label: t }))}
                            placeholder="Velg eller skriv nye tags..."
                            styles={customStyles}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sted</label>
                        <input
                            type="text" name="location" required value={formData.location} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tid for utførelse (Fritekst)</label>
                        <input
                            type="text" name="time_frame" placeholder="f.eks. 2022-2023" value={formData.time_frame} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-gray-700">Detaljer</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Areal (m²)</label>
                            <input
                                type="number" name="area_m2" value={formData.area_m2} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">MNOK</label>
                            <input
                                type="number" step="0.1" name="contract_value_mnok" value={formData.contract_value_mnok} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Entrepriseform</label>
                        <input
                            type="text" name="contract_type" value={formData.contract_type} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Utført av (Entreprenør)</label>
                        <input
                            type="text" name="performed_by" value={formData.performed_by} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Miljøsertifisering</label>
                        <input
                            type="text" name="certification" placeholder="BREEAM-NOR..." value={formData.certification} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                        <textarea
                            name="description" rows={3} value={formData.description} onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firmaets rolle i prosjektet</label>
                        <textarea
                            name="role_description" rows={3} value={formData.role_description || ''} onChange={handleChange}
                            placeholder="Beskriv firmaets spesifikke ansvar og leveranser..."
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    {/* NEW: Relevans Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relevans</label>
                        <textarea
                            name="relevance" rows={3} value={formData.relevance || ''} onChange={handleChange}
                            placeholder="Beskriv hvorfor prosjektet er relevant..."
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                    {/* NEW: Challenges Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Utfordringer</label>
                        <textarea
                            name="challenges" rows={3} value={formData.challenges || ''} onChange={handleChange}
                            placeholder="Beskriv spesielle utfordringer i prosjektet..."
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                    </div>

                </div>

                {/* Contact Info */}
                <div className="space-y-4 md:col-span-2 border-t border-gray-100 dark:border-gray-700 pt-6 mt-2">
                    <h3 className="font-semibold text-lg text-gray-700">Kontaktinformasjon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Byggherre</label>
                            <input
                                type="text" name="client" value={formData.client} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson</label>
                            <input
                                type="text" name="contact_person" value={formData.contact_person} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input
                                type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Epost</label>
                            <input
                                type="email" name="contact_email" value={formData.contact_email} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-omf-cyan text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Internal Attachments Section */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <PaperClipIcon className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Interne Vedlegg</h3>
                </div>

                {isEdit ? (
                    <div
                        {...getAttRootProps()}
                        className={`p-6 rounded border-2 border-dashed transition-colors cursor-pointer
                            ${isAttDragActive ? 'border-omf-cyan bg-blue-50 dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}
                        `}
                    >
                        <input {...getAttInputProps()} />
                        <div className="mb-4 text-center">
                            <div className="inline-flex items-center justify-center p-2 bg-white dark:bg-gray-600 rounded-full shadow-sm mb-2">
                                <ArrowDownTrayIcon className="h-6 w-6 text-omf-cyan rotate-180" />
                            </div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">
                                {isUploadingAttachment ? 'Laster opp...' : (isAttDragActive ? 'Slipp filene her...' : 'Dra og slipp filer her, eller klikk for å velge')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Notater (Word, PDF) og bilder som ikke skal vises på prosjektsiden.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {attachments.length === 0 && (
                                <p className="text-sm text-gray-400 italic">Ingen vedlegg lastet opp.</p>
                            )}
                            {attachments.map((att) => (
                                <div key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {att.file_type === 'image' ? <PhotoIcon className="h-5 w-5 text-purple-500 flex-shrink-0" /> :
                                            att.file_type === 'pdf' ? <DocumentIcon className="h-5 w-5 text-red-500 flex-shrink-0" /> :
                                                att.file_type === 'word' ? <DocumentIcon className="h-5 w-5 text-blue-500 flex-shrink-0" /> :
                                                    <PaperClipIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />}

                                        <div className="flex flex-col min-w-0">
                                            <a
                                                href={`http://localhost:8000${att.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-sm font-medium text-omf-dark dark:text-white hover:text-omf-cyan truncate"
                                            >
                                                {att.filename}
                                            </a>
                                            <span className="text-xs text-gray-400">{new Date(att.upload_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(att.id); }}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                        title="Slett vedlegg"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded text-sm text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-900">
                        Du må lagre prosjektet før du kan laste opp interne vedlegg.
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-8 items-center">
                {isEdit ? (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm"
                    >
                        Slett prosjekt
                    </button>
                ) : (
                    <div></div> // Spacer to keep save/cancel on the right
                )}

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 from-neutral-50 transition-colors"
                    >
                        Avbryt
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-omf-cyan text-white font-bold rounded-sm shadow hover:bg-opacity-90 disabled:opacity-50 transition-colors uppercase tracking-wide"
                    >
                        {loading ? 'Lagrer...' : (isEdit ? 'Oppdater Prosjekt' : 'Opprett Prosjekt')}
                    </button>
                </div>
            </div>
        </form >
    );
}
