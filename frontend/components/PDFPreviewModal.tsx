import React, { useState, useEffect } from 'react';
import { ProjectPDF } from './ProjectPDF';
import { pdf } from '@react-pdf/renderer';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { saveAs } from 'file-saver';

interface PDFPreviewModalProps {
    project: any;
    options: any;
    selectedImages: string[];
    onClose: () => void;
    initialLayout?: string;
}

const LAYOUTS = [
    { id: 'standard', label: 'Standard' },
    { id: 'standard_old', label: 'Standard - gammel farge' },
    { id: 'standard_single_image', label: 'Standard - ett bilde' },
    { id: 'standard_2', label: 'Standard 2 - to kolonner' },
    { id: 'standard_3', label: 'Standard 3 - breddeformat' },
    { id: 'bottomHeavy', label: 'Oppe og nede' },
    { id: 'twoColumn', label: 'To Kolonner' },
    { id: 'gallery', label: 'Bildegalleri' }
];

export const PDFPreviewModal = ({ project, options, selectedImages, onClose, initialLayout = 'standard' }: PDFPreviewModalProps) => {
    const [activeLayout, setActiveLayout] = useState(initialLayout);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const generatePreview = async () => {
            setLoading(true);
            try {
                // Determine images to use - logic similar to ProjectPDF wrapper
                // But here we rely on the passed `selectedImages` or project defaults
                // Ideally `project` prop already has the correct image setup, 
                // but let's ensure we pass explicit selectedImages if present.

                const blob = await pdf(
                    <ProjectPDF
                        project={project}
                        options={options}
                        layout={activeLayout as any}
                        selectedImages={selectedImages}
                    />
                ).toBlob();

                const url = URL.createObjectURL(blob);

                if (isMounted) {
                    setPdfUrl(url);
                    setPdfBlob(blob);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Preview generation failed:", error);
                if (isMounted) setLoading(false);
            }
        };

        generatePreview();

        return () => {
            isMounted = false;
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [activeLayout, project, options, selectedImages]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 dark:text-white">Velg Layout</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {LAYOUTS.map(layout => (
                            <button
                                key={layout.id}
                                onClick={() => setActiveLayout(layout.id)}
                                className={`w-full text-left px-4 py-3 rounded border transition-all ${activeLayout === layout.id
                                    ? 'bg-omf-cyan text-white border-omf-cyan shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-omf-cyan hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="font-medium block">{layout.label}</span>
                                <span className="text-xs opacity-80 block mt-1">
                                    {layout.id === 'standard' && 'Sidepanel med fakta'}
                                    {layout.id === 'standard_old' && 'Samme som Standard, men med gammel fargepalett'}
                                    {layout.id === 'standard_single_image' && 'Viser kun hovedbilde + gammel fargepalett'}
                                    {layout.id === 'standard_2' && 'Delt tekstvisning (2 kolonner) + gammel fargepalett'}
                                    {layout.id === 'standard_3' && 'Landskapsbilde + gammel fargepalett'}
                                    {layout.id === 'bottomHeavy' && 'Bilder øverst, tekst bunn'}
                                    {layout.id === 'twoColumn' && 'Delt visning (50/50)'}
                                    {layout.id === 'gallery' && 'Fokus på flere bilder'}
                                </span>
                            </button>
                        ))}
                    </div>



                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <button
                            onClick={() => {
                                if (pdfBlob) {
                                    saveAs(pdfBlob, `${project.name || 'prosjekt'}_referanse.pdf`);
                                }
                            }}
                            disabled={!pdfBlob || loading}
                            className="w-full py-2 bg-omf-cyan text-white rounded hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Last ned PDF
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Lukk
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900/50 flex flex-col items-center justify-center p-8 relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-omf-cyan"></div>
                        </div>
                    )}

                    {pdfUrl ? (
                        <iframe
                            src={`${pdfUrl}#toolbar=0&view=FitV`}
                            className="w-full h-full rounded shadow-lg bg-white"
                            title="PDF Preview"
                        />
                    ) : (
                        !loading && <div className="text-gray-500">Kunne ikke generere forhåndsvisning</div>
                    )}
                </div>
            </div>
        </div>
    );
};
