'use client';
import { API_URL, getStaticUrl } from '../lib/api';

import { useState, useRef } from 'react';
import { XMarkIcon, CloudArrowUpIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface CVIngestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CVIngestionModal({ isOpen, onClose, onSuccess }: CVIngestionModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/employees/upload-cv`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Kunne ikke tolke CV-en. Sjekk at det er en gyldig PDF.');
            }

            const data = await response.json();
            setParsedData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!parsedData) return;

        try {
            const response = await fetch(`${API_URL}/employees/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData),
            });

            if (!response.ok) {
                throw new Error('Kunne ikke lagre ansatt.');
            }

            onSuccess();
            setFile(null);
            setParsedData(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-bold text-omf-dark dark:text-white flex items-center gap-2">
                        <CloudArrowUpIcon className="h-6 w-6 text-omf-cyan" />
                        Importer CV
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {!parsedData ? (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center hover:border-omf-cyan cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/30 group"
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                                <CloudArrowUpIcon className="h-16 w-16 mx-auto text-gray-400 group-hover:text-omf-cyan mb-4 transition-colors" />
                                <p className="text-lg font-semibold text-omf-dark dark:text-gray-200">
                                    {file ? file.name : 'Klikk eller dra CV-PDF hit'}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">Støtter kun .pdf filer</p>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || isProcessing}
                                    className="bg-omf-cyan text-white px-8 py-3 rounded-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                                >
                                    {isProcessing ? (
                                        <>
                                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                            Analyserer...
                                        </>
                                    ) : (
                                        'Start AI-tolking'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-omf-lime/10 dark:bg-omf-lime/5 border border-omf-lime/20 p-4 rounded-lg flex items-start gap-3">
                                <CheckIcon className="h-6 w-6 text-omf-lime shrink-0 grid place-items-center bg-white dark:bg-gray-800 rounded-full p-1" />
                                <div>
                                    <h4 className="font-bold text-omf-dark dark:text-white">AI-tolking ferdig!</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Vennligst gå over informasjonen før du lagrer den i CV-banken.</p>
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">Navn</label>
                                        <input
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded p-2 text-omf-dark dark:text-white"
                                            value={parsedData.name || ''}
                                            onChange={e => setParsedData({ ...parsedData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">Tittel</label>
                                        <input
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded p-2 text-omf-dark dark:text-white"
                                            value={parsedData.title || ''}
                                            onChange={e => setParsedData({ ...parsedData, title: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">Bio</label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded p-2 text-omf-dark dark:text-white h-24 text-sm"
                                        value={parsedData.bio || ''}
                                        onChange={e => setParsedData({ ...parsedData, bio: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 block mb-1">Erfaring ({parsedData.work_experiences?.length || 0})</label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                        {parsedData.work_experiences?.map((exp: any, i: number) => (
                                            <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                                <strong>{exp.company}</strong> - {exp.title} ({exp.time_frame})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setParsedData(null)}
                                    className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-sm font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    Prøv igjen
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 bg-omf-cyan text-white py-3 rounded-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-cyan-500/20 transition-all"
                                >
                                    Lagre ansatt
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
