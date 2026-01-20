import { Page, Text as PdfText, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Styles for the CV
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        paddingBottom: 40,
    },
    header: {
        height: 60,
        backgroundColor: '#011627',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        borderBottomWidth: 4,
        borderBottomColor: '#CED600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: '#011627',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#FFF',
        fontSize: 8,
    },
    mainContent: {
        flexDirection: 'row',
        padding: 40,
        flex: 1,
    },
    leftCol: {
        width: '32%',
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: '#EEEEEE',
    },
    rightCol: {
        width: '68%',
        paddingLeft: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#CED600',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#011627',
        marginBottom: 2,
    },
    title: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#009DE0',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
    },
    contactSection: {
        marginBottom: 20,
    },
    contactLabel: {
        fontSize: 6,
        color: '#888888',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 1,
    },
    contactValue: {
        fontSize: 8,
        color: '#333333',
        marginBottom: 8,
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#011627',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#CED600',
        paddingBottom: 2,
        marginBottom: 10,
        marginTop: 15,
    },
    experienceItem: {
        marginBottom: 12,
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 1,
    },
    expCompany: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#333333',
    },
    expTime: {
        fontSize: 8,
        color: '#009DE0',
        fontWeight: 'bold',
    },
    expTitle: {
        fontSize: 8,
        color: '#009DE0',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    expDesc: {
        fontSize: 8,
        color: '#555555',
        lineHeight: 1.3,
    },
    projectItem: {
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 4,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#CED600',
    },
    projectTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    projectName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#011627',
        width: '70%',
    },
    projectTime: {
        fontSize: 8,
        color: '#009DE0',
        fontWeight: 'bold',
    },
    projectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    gridItem: {
        width: '50%',
        marginBottom: 4,
    },
    gridLabel: {
        fontSize: 6,
        color: '#888',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    gridValue: {
        fontSize: 8,
        color: '#333',
        fontWeight: 'medium',
    },
    projectLabel: {
        fontSize: 6,
        color: '#009DE0',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2,
        marginTop: 4,
    },
    projectText: {
        fontSize: 8,
        color: '#444444',
        lineHeight: 1.4,
    },
    eduItem: {
        marginBottom: 8,
    },
    eduInst: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#333333',
    },
    eduDegree: {
        fontSize: 7,
        color: '#009DE0',
    },
    compItem: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    compText: {
        fontSize: 8,
        color: '#444',
    }
});

const Text = (props: any) => (
    <PdfText {...props} />
);

export const EmployeePDF = ({ employee }: { employee: any }) => {
    return (
        <Document title={`CV - ${employee.name}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src="/omf-symbol.png" style={{ width: 60, objectFit: 'contain' }} />
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>CURRICULUM VITAE</Text>
                </View>

                <View style={styles.mainContent}>
                    {/* Left Column */}
                    <View style={styles.leftCol}>
                        {employee.image_url && (
                            <Image src={employee.image_url} style={styles.profileImage} />
                        )}

                        <Text style={styles.name}>{employee.name}</Text>
                        <Text style={styles.title}>{employee.title || 'Ansatt'}</Text>

                        <View style={styles.contactSection}>
                            <Text style={styles.sectionHeader}>Kontakt</Text>
                            <Text style={styles.contactLabel}>Epost</Text>
                            <Text style={styles.contactValue}>{employee.email || '-'}</Text>
                            <Text style={styles.contactLabel}>Telefon</Text>
                            <Text style={styles.contactValue}>{employee.phone || '-'}</Text>
                            <Text style={styles.contactLabel}>Selskap</Text>
                            <Text style={styles.contactValue}>{employee.company || 'Ø.M. Fjeld'}</Text>
                        </View>

                        {employee.key_competencies && employee.key_competencies.length > 0 && (
                            <View style={{ marginBottom: 15 }}>
                                <Text style={styles.sectionHeader}>Nøkkelkompetanse</Text>
                                {employee.key_competencies.map((comp: string, idx: number) => (
                                    <View key={idx} style={styles.compItem}>
                                        <Text style={{ color: '#CED600', marginRight: 4 }}>•</Text>
                                        <Text style={styles.compText}>{comp}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text style={styles.sectionHeader}>Utdanning</Text>
                        {employee.educations?.map((edu: any, idx: number) => (
                            <View key={idx} style={styles.eduItem}>
                                <Text style={styles.eduInst}>{edu.institution}</Text>
                                <Text style={styles.eduDegree}>{edu.degree}</Text>
                                <Text style={{ fontSize: 6, color: '#999' }}>{edu.time_frame}</Text>
                            </View>
                        ))}

                        <Text style={styles.sectionHeader}>Språk</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                            {employee.languages?.map((lang: string, idx: number) => (
                                <Text key={idx} style={{ fontSize: 7, color: '#333', backgroundColor: '#F0F0F0', padding: '1 3', borderRadius: 2 }}>
                                    {lang}
                                </Text>
                            ))}
                        </View>
                    </View>

                    {/* Right Column */}
                    <View style={styles.rightCol}>
                        {employee.bio && (
                            <View style={{ marginBottom: 15 }}>
                                <Text style={[styles.sectionHeader, { marginTop: 0 }]}>Profil</Text>
                                <Text style={{ fontSize: 8, color: '#333', lineHeight: 1.4 }}>{employee.bio}</Text>
                            </View>
                        )}

                        <Text style={styles.sectionHeader}>Arbeidserfaring</Text>
                        {employee.work_experiences?.slice(0, 10).map((exp: any, idx: number) => (
                            <View key={idx} style={styles.experienceItem}>
                                <View style={styles.expHeader}>
                                    <Text style={styles.expCompany}>{exp.company}</Text>
                                    <Text style={styles.expTime}>{exp.time_frame}</Text>
                                </View>
                                <Text style={styles.expTitle}>{exp.title}</Text>
                                {exp.description && <Text style={styles.expDesc}>{exp.description}</Text>}
                            </View>
                        ))}

                        <Text style={styles.sectionHeader}>Utvalgte Prosjekter</Text>
                        {employee.team_memberships?.map((membership: any, idx: number) => {
                            const proj = membership.project;
                            return (
                                <View key={idx} style={styles.projectItem}>
                                    <View style={styles.projectTitleRow}>
                                        <Text style={styles.projectName}>{proj.name}</Text>
                                        <Text style={styles.projectTime}>{proj.time_frame}</Text>
                                    </View>

                                    <View style={styles.projectGrid}>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Oppdragsgiver</Text>
                                            <Text style={styles.gridValue}>{proj.client || '-'}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Rolle på CV</Text>
                                            <Text style={[styles.gridValue, { color: '#009DE0', fontWeight: 'bold' }]}>{membership.role}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Entrepriseform</Text>
                                            <Text style={styles.gridValue}>{proj.contract_type || '-'}</Text>
                                        </View>
                                        <View style={styles.gridItem}>
                                            <Text style={styles.gridLabel}>Type bygg</Text>
                                            <Text style={styles.gridValue}>{proj.type || '-'}</Text>
                                        </View>
                                    </View>

                                    {membership.cv_relevance && (
                                        <View style={{ marginTop: 4 }}>
                                            <Text style={styles.projectLabel}>Relevans</Text>
                                            <Text style={styles.projectText}>{membership.cv_relevance}</Text>
                                        </View>
                                    )}

                                    {membership.role_summary && (
                                        <View style={{ marginTop: 4 }}>
                                            <Text style={styles.projectLabel}>Utfyllende om rolle</Text>
                                            <Text style={styles.projectText}>{membership.role_summary}</Text>
                                        </View>
                                    )}

                                    {membership.reference_name && (
                                        <View style={{ marginTop: 6, borderTopWidth: 0.5, borderTopColor: '#CCC', paddingTop: 4 }}>
                                            <Text style={{ fontSize: 7, color: '#666' }}>
                                                Referanse: <Text style={{ color: '#333', fontWeight: 'bold' }}>{membership.reference_name}</Text>
                                                {membership.reference_phone && <Text> ({membership.reference_phone})</Text>}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>www.omfjeld.no</Text>
                </View>
            </Page>
        </Document>
    );
};
