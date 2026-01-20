import { Page, Text as PdfText, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
// @ts-ignore
import hyphen from 'hyphen';
// @ts-ignore
import nb from 'hyphen/patterns/nb';

const hyphenator = hyphen(nb);
const norwegianHyphenation = (word: string) => hyphenator(word).split('\u00AD');

// Override Text component to enforce Norwegian hyphenation globally
const Text = (props: any) => (
    <PdfText {...props} hyphenationCallback={norwegianHyphenation} />
);

// Register fonts if needed, using standard Helvetica for now
// Font.register({ family: 'Roboto', src: '...' });

// Styles for different layouts
const commonStyles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
    header: { height: 60, backgroundColor: '#011627', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, borderBottomWidth: 4, borderBottomColor: '#CED600' },
    headerText: { color: '#009DE0', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#011627', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: '#FFF', fontSize: 8 },
});

// Shared Branding Styles used across all layouts to ensure consistency
const brandingStyles = StyleSheet.create({
    title: { fontSize: 16, fontWeight: 'heavy', color: '#011627', marginBottom: 6, textTransform: 'uppercase', lineHeight: 1.2 },
    subtitle: { fontSize: 10, fontWeight: 'bold', color: '#009DE0', marginBottom: 20, textTransform: 'uppercase' },
    sectionHeader: { fontSize: 11, fontWeight: 'bold', color: '#011627', marginBottom: 15, borderBottomWidth: 2, borderBottomColor: '#CED600', paddingBottom: 5 },
    body: { fontSize: 9, lineHeight: 1.4, color: '#333' },
    label: { fontSize: 7.5, color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
    value: { fontSize: 9, color: '#333' },
    factContainer: { marginBottom: 10 },
});

// Helper component for a Vertical Fact Item (Label top, Value bottom)
const FactItem = ({ label, value }: { label: string, value: any }) => (
    value ? (
        <View style={brandingStyles.factContainer}>
            <Text style={brandingStyles.label}>{label}</Text>
            <Text style={brandingStyles.value}>{value}</Text>
        </View>
    ) : null
);

// Helper to split text into roughly two equal columns
const splitText = (text: string, ratio: number = 0.5) => {
    if (!text) return ['', ''];
    if (text.length < 300) return [text, '']; // Don't split short text

    const middle = Math.floor(text.length * ratio);
    const before = text.lastIndexOf('. ', middle);
    const after = text.indexOf('. ', middle);

    let splitIdx = middle;

    // Try to split at a sentence end (. )
    if (before !== -1 && after !== -1) {
        splitIdx = (middle - before < after - middle) ? before + 1 : after + 1;
    } else if (before !== -1) {
        splitIdx = before + 1;
    } else if (after !== -1) {
        splitIdx = after + 1;
    } else {
        // Fallback: Split at nearest space if no sentence break found
        const spaceBefore = text.lastIndexOf(' ', middle);
        const spaceAfter = text.indexOf(' ', middle);
        if (spaceBefore !== -1 && spaceAfter !== -1) {
            splitIdx = (middle - spaceBefore < spaceAfter - middle) ? spaceBefore + 1 : spaceAfter + 1;
        } else if (spaceBefore !== -1) splitIdx = spaceBefore + 1;
        else if (spaceAfter !== -1) splitIdx = spaceAfter + 1;
    }

    return [text.slice(0, splitIdx).trim(), text.slice(splitIdx).trim()];
};

// Standard Sidebar Layout (Updated)
const StandardLayout = ({ project, options, shouldSplit = false, layout }: { project: any, options: any, shouldSplit?: boolean, layout?: string }) => {
    // Show up to 3 images vertically, but limit based on available space if needed.
    const displayImages = project.all_images && project.all_images.length > 0
        ? project.all_images.slice(0, 3)
        : (project.image_url ? [{ url: project.image_url }] : []);

    const imageHeight = (count: number) => {
        if (layout === 'standard_3' && count === 1) return 200; // Reduced to prevent page overflow
        if (count === 1) return 350;
        if (count === 2) return 180;
        return 130;
    };
    const h = imageHeight(displayImages.length);

    let descCol1 = project.description || '';
    let descCol2 = '';

    if (shouldSplit) {
        // Use helper to split with 70% ratio (aggressively push more to wider left column to fill vertical space)
        const [d1, d2] = splitText(project.description || '', 0.70);
        descCol1 = d1;
        descCol2 = d2;
    }

    return (
        <View style={{ padding: 40, paddingBottom: 20, flex: 1 }}>
            {/* Top Section: Header Info, Images, Facts */}
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {/* Main Column (Images & Title) */}
                <View style={{ width: '60%', paddingRight: 20 }}>
                    <Text style={brandingStyles.title}>
                        {project.name}
                    </Text>
                    <Text style={[brandingStyles.subtitle, { marginBottom: 10 }]}>
                        {project.location}
                    </Text>

                    {/* Image Container */}
                    <View style={{
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 10,
                        alignItems: 'flex-start'
                    }}>
                        {displayImages.map((img: any, index: number) => (
                            <Image
                                key={index}
                                // eslint-disable-next-line jsx-a11y/alt-text
                                style={{
                                    width: '100%',
                                    height: h,
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    borderRadius: 2
                                }}
                                src={img.url}
                            />
                        ))}
                        {displayImages.length === 0 && (
                            <View style={{ width: '100%', height: 200, marginBottom: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
                                <Text style={{ color: '#ccc' }}>Ingen bilde</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Side Column Data (Facts & Contact) */}
                <View style={{ width: '40%', borderLeftWidth: 1, borderLeftColor: '#eee', paddingLeft: 20 }}>
                    <Text style={brandingStyles.sectionHeader}>Fakta</Text>
                    <FactItem label="Sted" value={project.location} />
                    <FactItem label="Type bygg" value={project.type} />
                    <FactItem label="Tid" value={project.time_frame} />
                    <FactItem label="Areal" value={project.area_m2 ? `${project.area_m2} m²` : null} />
                    <FactItem label="Entreprise" value={project.contract_type} />
                    <FactItem label="Utført av" value={project.performed_by} />
                    <FactItem label="Miljøkrav" value={project.certification} />

                    {options.showEconomy && (
                        <View style={{ marginTop: 10 }}>
                            <FactItem label="Kontrakt" value={project.contract_value_mnok ? `${project.contract_value_mnok} MNOK` : null} />
                        </View>
                    )}

                    {options.showContact && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={brandingStyles.sectionHeader}>Referanse</Text>
                            <FactItem label="Byggherre" value={project.client} />
                            <FactItem label="Kontaktperson" value={project.contact_person} />
                            <FactItem label="Epost" value={project.contact_email} />
                            <FactItem label="Tlf" value={project.contact_phone} />
                        </View>
                    )}

                    {/* Standard 3: Description moved to right column */}
                    {layout === 'standard_3' && options.showDescription && (
                        <View style={{ marginTop: 10 }}>
                            <Text style={[brandingStyles.sectionHeader, { marginBottom: 10 }]}>Om prosjektet</Text>
                            <Text style={brandingStyles.body}>{descCol1}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Standard 2 Logic:
                Full width text line ONLY if there is no conflicting content in the right column (Relevans/Role/Challenges).
                If Relevans exists, we keep the header inside the Left Column to avoid collision.
            */}
            {shouldSplit && options.showDescription && (!options.showRelevance || !project.relevance) && (!options.showRole || !project.role_description) && (!options.showChallenges || !project.challenges) && (
                <View style={{ marginBottom: 10 }}>
                    <Text style={[brandingStyles.sectionHeader, { marginBottom: 0 }]}>Om prosjektet</Text>
                </View>
            )}

            {/* Bottom Section: Flowing Columns */}
            {(options.showDescription || options.showRelevance) && (
                <View style={{ marginTop: 0, flexDirection: 'row', flex: 1 }}>
                    {/* Left Column (60% width) */}
                    <View style={{ width: '60%', paddingRight: 20 }}>
                        {options.showDescription && layout !== 'standard_3' && (
                            <>
                                {/* Show local header if NOT splitting OR if splitting but forced back to local due to right column content */}
                                {(!shouldSplit || (shouldSplit && ((options.showRelevance && project.relevance) || (options.showRole && project.role_description) || (options.showChallenges && project.challenges)))) && (
                                    <Text style={[brandingStyles.sectionHeader, { marginBottom: 10 }]}>Om prosjektet</Text>
                                )}
                                <Text style={brandingStyles.body}>{descCol1}</Text>
                            </>
                        )}
                    </View>

                    {/* Right Column (40% width) */}
                    <View style={{ width: '40%', paddingLeft: 20 }}>

                        {/* Relevans - Moved to top for alignment */}
                        {options.showRelevance && project.relevance && (
                            <View style={{ marginBottom: 10 }}>
                                <Text style={[brandingStyles.sectionHeader, { marginBottom: 10 }]}>Relevans</Text>
                                <Text style={brandingStyles.body}>{project.relevance}</Text>
                            </View>
                        )}

                        {options.showDescription && (
                            <>
                                {descCol2 ? <Text style={[brandingStyles.body, { marginBottom: 10 }]}>{descCol2}</Text> : null}

                                {options.showRole && project.role_description && (
                                    <View style={{ marginBottom: 10 }}>
                                        <Text style={{ ...brandingStyles.body, fontWeight: 'bold' }}>Firmaets rolle:</Text>
                                        <Text style={brandingStyles.body}>{project.role_description}</Text>
                                    </View>
                                )}

                                {options.showChallenges && project.challenges && (
                                    <View style={{ marginBottom: 10 }}>
                                        <Text style={{ ...brandingStyles.body, fontWeight: 'bold' }}>Utfordringer:</Text>
                                        <Text style={brandingStyles.body}>{project.challenges}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

// Standard Single Image Layout (Continuous Flow)
const StandardSingleImageLayout = ({ project, options }: { project: any, options: any }) => {
    // Single image is guaranteed by the parent component logic
    const displayImages = project.all_images && project.all_images.length > 0
        ? project.all_images.slice(0, 1)
        : (project.image_url ? [{ url: project.image_url }] : []);

    const image = displayImages[0];
    const descCol1 = project.description || '';

    return (
        <View style={{ padding: 40, paddingBottom: 60, flex: 1, flexDirection: 'row' }}>
            {/* Left Column: Title, Image, Description */}
            <View style={{ width: '60%', paddingRight: 20 }}>
                <Text style={brandingStyles.title}>
                    {project.name}
                </Text>
                <Text style={[brandingStyles.subtitle, { marginBottom: 10 }]}>
                    {project.location}
                </Text>

                <View style={{ marginBottom: 20 }}>
                    {image ? (
                        <Image
                            // eslint-disable-next-line jsx-a11y/alt-text
                            style={{
                                width: '100%',
                                height: 350,
                                objectFit: 'cover',
                                objectPosition: 'center',
                                borderRadius: 2
                            }}
                            src={image.url}
                        />
                    ) : (
                        <View style={{ width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' }}>
                            <Text style={{ color: '#ccc' }}>Ingen bilde</Text>
                        </View>
                    )}
                </View>

                {options.showDescription && (
                    <View>
                        <Text style={[brandingStyles.sectionHeader, { marginBottom: 6 }]}>Om prosjektet</Text>
                        <Text style={brandingStyles.body}>{descCol1}</Text>
                    </View>
                )}
            </View>

            {/* Right Column: Facts, Contact, Relevans, etc */}
            <View style={{ width: '40%', borderLeftWidth: 1, borderLeftColor: '#eee', paddingLeft: 20 }}>
                <Text style={brandingStyles.sectionHeader}>Fakta</Text>
                <FactItem label="Sted" value={project.location} />
                <FactItem label="Type bygg" value={project.type} />
                <FactItem label="Tid" value={project.time_frame} />
                <FactItem label="Areal" value={project.area_m2 ? `${project.area_m2} m²` : null} />
                <FactItem label="Entreprise" value={project.contract_type} />
                <FactItem label="Utført av" value={project.performed_by} />
                <FactItem label="Miljøkrav" value={project.certification} />

                {options.showEconomy && (
                    <View style={{ marginTop: 10 }}>
                        <FactItem label="Kontrakt" value={project.contract_value_mnok ? `${project.contract_value_mnok} MNOK` : null} />
                    </View>
                )}

                {options.showContact && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={brandingStyles.sectionHeader}>Referanse</Text>
                        <FactItem label="Byggherre" value={project.client} />
                        <FactItem label="Kontaktperson" value={project.contact_person} />
                        <FactItem label="Epost" value={project.contact_email} />
                        <FactItem label="Tlf" value={project.contact_phone} />
                    </View>
                )}

                {/* Additional Metadata in Right Column for this layout */}
                {options.showRelevance && project.relevance && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={[brandingStyles.sectionHeader, { marginBottom: 6 }]}>Relevans</Text>
                        <Text style={brandingStyles.body}>{project.relevance}</Text>
                    </View>
                )}

                {options.showRole && project.role_description && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={{ ...brandingStyles.body, fontWeight: 'bold' }}>Firmaets rolle:</Text>
                        <Text style={brandingStyles.body}>{project.role_description}</Text>
                    </View>
                )}

                {options.showChallenges && project.challenges && (
                    <View style={{ marginTop: 15 }}>
                        <Text style={{ ...brandingStyles.body, fontWeight: 'bold' }}>Utfordringer:</Text>
                        <Text style={brandingStyles.body}>{project.challenges}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

// Variant 2: Bottom Focus (Oppe og nede Style)
const BottomHeavyLayout = ({ project, options }: { project: any, options: any }) => {
    const displayImages = project.all_images && project.all_images.length > 0
        ? project.all_images.slice(0, 2)
        : (project.image_url ? [{ url: project.image_url }] : []);

    return (
        <View style={{ flex: 1 }}>
            <View style={{ height: '50%', width: '100%', flexDirection: 'row', backgroundColor: '#f0f0f0' }}>
                {displayImages.map((img: any, index: number) => (
                    <Image
                        key={index}
                        style={{ width: displayImages.length > 1 ? '50%' : '100%', height: '100%', objectFit: 'cover' }}
                        src={img.url}
                    />
                ))}
                {displayImages.length === 0 && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ccc' }}>Ingen bilde</Text></View>}
            </View>

            <View style={{ height: '50%', padding: 40, flexDirection: 'row', gap: 30 }}>
                <View style={{ width: '50%' }}>
                    <Text style={brandingStyles.title}>{project.name}</Text>
                    <Text style={brandingStyles.subtitle}>{project.location}</Text>
                    {options.showDescription && <Text style={brandingStyles.body}>{project.description}</Text>}
                </View>
                <View style={{ width: '25%', borderLeftWidth: 1, borderLeftColor: '#eee', paddingLeft: 20 }}>
                    <Text style={brandingStyles.sectionHeader}>Fakta</Text>
                    <FactItem label="Sted" value={project.location} />
                    <FactItem label="Type bygg" value={project.type} />
                    <FactItem label="Tid" value={project.time_frame} />
                    <FactItem label="Areal" value={project.area_m2 ? `${project.area_m2} m²` : null} />
                    <FactItem label="Entreprise" value={project.contract_type} />
                    <FactItem label="Utført av" value={project.performed_by} />
                    <FactItem label="Kontrakt" value={options.showEconomy && project.contract_value_mnok ? `${project.contract_value_mnok} MNOK` : null} />
                </View>
                <View style={{ width: '25%', borderLeftWidth: 1, borderLeftColor: '#eee', paddingLeft: 20 }}>
                    {options.showContact && (
                        <View>
                            <Text style={brandingStyles.sectionHeader}>Referanse</Text>
                            <FactItem label="Byggherre" value={project.client} />
                            <FactItem label="Kontaktperson" value={project.contact_person} />
                            <FactItem label="Epost" value={project.contact_email} />
                            <FactItem label="Tlf" value={project.contact_phone} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

// Variant 3: Two Column (50/50)
const TwoColumnLayout = ({ project, options }: { project: any, options: any }) => {
    // Show up to 3 images vertically on the left side
    const displayImages = project.all_images && project.all_images.length > 0
        ? project.all_images.slice(0, 3)
        : (project.image_url ? [{ url: project.image_url }] : []);

    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ width: '50%', height: '100%', backgroundColor: '#f0f0f0', flexDirection: 'column' }}>
                {displayImages.map((img: any, index: number) => (
                    <Image
                        key={index}
                        // eslint-disable-next-line jsx-a11y/alt-text
                        style={{ width: '100%', height: `${100 / displayImages.length}%`, objectFit: 'cover', borderBottomWidth: index < displayImages.length - 1 ? 2 : 0, borderBottomColor: '#FFF' }}
                        src={img.url}
                    />
                ))}
            </View>
            <View style={{ width: '50%', padding: 40 }}>
                <View style={{ marginBottom: 20 }}>
                    <Text style={brandingStyles.title}>{project.name}</Text>
                    <Text style={brandingStyles.subtitle}>{project.location}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 20 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={brandingStyles.sectionHeader}>Fakta</Text>
                        <FactItem label="Sted" value={project.location} />
                        <FactItem label="Type" value={project.type} />
                        <FactItem label="Tid" value={project.time_frame} />
                        <FactItem label="Areal" value={project.area_m2 ? `${project.area_m2} m²` : null} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={brandingStyles.sectionHeader}>Info</Text>
                        <FactItem label="Utført av" value={project.performed_by} />
                        <FactItem label="Kontrakt" value={options.showEconomy && project.contract_value_mnok ? `${project.contract_value_mnok} MNOK` : null} />
                    </View>
                </View>

                {options.showDescription && (
                    <View style={{ marginTop: 20, marginBottom: 20 }}>
                        <Text style={brandingStyles.body}>{project.description}</Text>
                    </View>
                )}

                {options.showContact && (
                    <View>
                        <Text style={brandingStyles.sectionHeader}>Referanse</Text>
                        <FactItem label="Byggherre" value={project.client} />
                        <FactItem label="Kontaktperson" value={project.contact_person} />
                        <FactItem label="Epost" value={project.contact_email} />
                    </View>
                )}
            </View>
        </View>
    );
};

// Variant 4: Gallery Layout
const GalleryLayout = ({ project, options }: { project: any, options: any }) => {
    // Top 4 images from selected or all
    const imagesToShow = project.all_images ? project.all_images.slice(0, 4) : (project.image_url ? [{ url: project.image_url }] : []);

    return (
        <View style={{ padding: 40 }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={brandingStyles.title}>{project.name}</Text>
                <Text style={brandingStyles.subtitle}>{project.location}</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, height: 350, marginBottom: 30 }}>
                {imagesToShow.map((img: any, idx: number) => (
                    <Image
                        key={idx}
                        // eslint-disable-next-line jsx-a11y/alt-text
                        style={{ width: '48%', height: '48%', objectFit: 'cover', borderRadius: 2 }}
                        src={img.url}
                    />
                ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 40 }}>
                <View style={{ width: '60%' }}>
                    {options.showDescription && <Text style={brandingStyles.body}>{project.description}</Text>}
                </View>
                <View style={{ width: '40%' }}>
                    <Text style={brandingStyles.sectionHeader}>Fakta</Text>
                    <FactItem label="Sted" value={project.location} />
                    <FactItem label="Tid" value={project.time_frame} />
                    <FactItem label="Areal" value={project.area_m2 ? `${project.area_m2} m²` : null} />
                    <FactItem label="Kontrakt" value={options.showEconomy && project.contract_value_mnok ? `${project.contract_value_mnok} MNOK` : null} />

                    {options.showContact && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={brandingStyles.sectionHeader}>Referanse</Text>
                            <FactItem label="Byggherre" value={project.client} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

interface ProjectPDFProps {
    project: any;
    options: {
        showEconomy: boolean;
        showContact: boolean;
        showDescription: boolean;
        showRole?: boolean;
        showRelevance?: boolean;
        showChallenges?: boolean;
    };
    layout?: 'standard' | 'bottomHeavy' | 'twoColumn' | 'gallery' | 'standard_old' | 'standard_single_image' | 'standard_2' | 'standard_3';
    selectedImages?: string[];
}

export const ProjectPDF = ({ project, options, layout = 'standard', selectedImages = [] }: any) => {
    // If selectedImages are provided, override project.image_url and project.images
    let projectImages = (selectedImages.length > 0) ? selectedImages.map((url: string) => ({ url })) : project.images;

    // If "Standard - ett bilde" is selected, force restrict to 1 image only
    if (layout === 'standard_single_image' && projectImages && projectImages.length > 0) {
        projectImages = [projectImages[0]];
    }

    const projectWithImages = {
        ...project,
        image_url: (selectedImages.length > 0) ? selectedImages[0] : project.image_url,
        // For gallery view, we might want multiple images
        all_images: projectImages
    };

    // Dynamic Styles for Standard - Old Color (and single image variant which is based on it)
    const isOldColor = layout === 'standard_old' || layout === 'standard_single_image' || layout === 'standard_2' || layout === 'standard_3';

    const headerStyle = {
        ...commonStyles.header,
        backgroundColor: isOldColor ? '#00537c' : commonStyles.header.backgroundColor,
        borderBottomWidth: isOldColor ? 0 : commonStyles.header.borderBottomWidth,
        borderBottomColor: isOldColor ? 'transparent' : commonStyles.header.borderBottomColor
    };

    const footerStyle = {
        ...commonStyles.footer,
        backgroundColor: isOldColor ? '#00537c' : commonStyles.footer.backgroundColor
    };

    // Logo selection
    const logoSrc = isOldColor ? '/om-fjeld-logo-v2.png' : '/omf-symbol.png';
    const logoStyle = {
        width: isOldColor ? 80 : 70, // Reduced further by 20% (from 100 to 80)
        objectFit: 'contain' as const
    };

    return (
        <Document>
            <Page size="A4" style={commonStyles.page}>
                {/* Header is standard across ALL layouts now to maintain branding consistency */}
                <View style={headerStyle}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image
                        src={logoSrc}
                        style={logoStyle}
                    />
                    <Text style={{ color: 'white', fontSize: 10 }}>Prosjektreferanse</Text>
                </View>

                {(layout === 'standard' || layout === 'standard_old' || layout === 'standard_2' || layout === 'standard_3') && <StandardLayout project={projectWithImages} options={options} shouldSplit={layout === 'standard_2'} layout={layout} />}
                {layout === 'standard_single_image' && <StandardSingleImageLayout project={projectWithImages} options={options} />}
                {layout === 'bottomHeavy' && <BottomHeavyLayout project={projectWithImages} options={options} />}
                {layout === 'twoColumn' && <TwoColumnLayout project={projectWithImages} options={options} />}
                {layout === 'gallery' && <GalleryLayout project={projectWithImages} options={options} />}

                <View style={footerStyle}>
                    <Text style={commonStyles.footerText}>www.omfjeld.no</Text>
                </View>
            </Page >
        </Document >
    );
};
