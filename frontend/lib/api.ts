// API Configuration
// Uses environment variable in production, localhost in development

const getApiUrl = (): string => {
    // In browser (client-side), use NEXT_PUBLIC_API_URL or fallback to localhost
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    }
    // Server-side rendering - can also use the env var
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
};

export const API_URL = getApiUrl();

// Helper function to get full URL for static files
export const getStaticUrl = (path: string): string => {
    if (path.startsWith('http') || path.startsWith('blob:')) {
        return path;
    }
    return `${API_URL}${path}`;
};
