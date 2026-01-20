'use client';

import ProjectForm from '../../../../components/ProjectForm';
import { useParams } from 'next/navigation';

export default function EditProjectPage() {
    // We already have this file, but need to make sure the import path is correct and it matches what I wrote above.
    // The previous implementation was:
    // import ProjectForm from '../../../components/ProjectForm';
    // export default function EditProjectPage() { ... }
    // It seems correct. I will just leave it.
    // This tool call is actually redundant if I did it right before, but I'll write it just to be sure if I had doubts.
    // Actually, I wrote `frontend/app/project/[id]/page.tsx` as `EditProjectPage` in step 87.
    // BUT WAIT! I am overwriting `frontend/app/project/[id]/page.tsx` with `ProjectDetailPage` in the PREVIOUS tool call in THIS turn.
    // Ah! I have a conflict. `[id]/page.tsx` is the Detail page. `[id]/edit/page.tsx` should be the Edit page.
    // Step 87 wrote `frontend/app/project/[id]/page.tsx` as `EditProjectPage`.
    // The requirement implies a detail page AND an edit page.
    // Top-level View -> Detail.
    // Edit -> /project/[id]/edit.

    // So I need to:
    // 1. Move the previous "EditProjectPage" logic to `frontend/app/project/[id]/edit/page.tsx`.
    // 2. Keep the `ProjectDetailPage` logic in `frontend/app/project/[id]/page.tsx`.

    // I will use this tool call to write `frontend/app/project/[id]/edit/page.tsx`.

    const params = useParams();
    // Logic is same as before but just file location change.

    return (
        <div className="py-8">
            {/* I need the data fetching logic here too or pass it */}
            <EditProjectFormWrapper id={params.id as string} />
        </div>
    );
}

// Helper component to handle async fetch inside client component properly
import { useEffect, useState } from 'react';

function EditProjectFormWrapper({ id }: { id: string }) {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch(`http://localhost:8000/projects/${id}`)
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
    }, [id]);

    if (loading) return <div>Laster prosjekt...</div>;
    if (!project) return <div>Fant ikke prosjektet.</div>;

    return <ProjectForm initialData={project} isEdit={true} />;
}
