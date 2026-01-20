'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface FileDropzoneProps {
    onFileAccepted: (file: File) => void;
    isLoading: boolean;
}

export default function FileDropzone({ onFileAccepted, isLoading }: FileDropzoneProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileAccepted(acceptedFiles[0]);
        }
    }, [onFileAccepted]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        disabled: isLoading,
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-omf-cyan bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-gray-600">
                <ArrowUpTrayIcon className="h-8 w-8 text-gray-400" />
                {isLoading ? (
                    <p className="text-sm font-medium">Analyserer PDF...</p>
                ) : isDragActive ? (
                    <p className="text-sm font-medium text-omf-cyan">Slipp filen her ...</p>
                ) : (
                    <div>
                        <p className="text-sm font-medium">Hurtig-registrering</p>
                        <p className="text-xs text-gray-500 mt-1">Dra og slipp en PDF her for å fylle ut skjemaet automatisk</p>
                    </div>
                )}
            </div>
        </div>
    );
}
