import requests
import json
import sys

CANDIDATES = [
    {
        "name": "Silje Nordby",
        "title": "Prosjektleder",
        "company": "ØMF Hamar",
        "email": "sino@omfjeld.no",
        "phone": "915 42 188",
        "image_url": "/static/uploaded_images/emp_silje_nordby.jpg",
        "bio": "Silje Nordby er en engasjert og strukturert prosjektleder i ØMF Hamar med over 10 års erfaring innen komplekse offentlige formålsbygg og barnehager. Hun har spisskompetanse på massivtrekonstruksjoner, FutureBuilt-kriterier og BREEAM-sertifiseringer. Silje kjennetegnes av solid økonomistyring, åpen dialog med byggherrer og evnen til å lede tverrfaglige team gjennom krevende byggeprosesser til avtalt tid og budsjett.",
        "languages": ["Norsk (morsmål)", "Engelsk (flytende)"],
        "key_competencies": ["Massivtre", "FutureBuilt Plusshus", "BREEAM-NOR AP", "Offentlige anskaffelser", "NS 8407 / NS 8405"],
        "educations": [
            {"institution": "NTNU Trondheim", "degree": "Master i Bygg- og miljøteknikk (Sivilingeniør)", "time_frame": "2010 – 2015"},
            {"institution": "BI Executive", "degree": "Prosjektledelse og Byggherrestyring", "time_frame": "2019"}
        ],
        "work_experiences": [
            {"company": "ØMF Hamar", "title": "Prosjektleder", "time_frame": "2019 – d.d.", "description": "Totalansvar for fremdrift, økonomi og SHA på store offentlige og private byggeprosjekter."},
            {"company": "Veidekke Entreprenør", "title": "Prosjektingeniør", "time_frame": "2015 – 2019", "description": "Oppfølging av tekniske fag, innkjøp og fremdriftsplanlegging på skole- og helsebygg."}
        ],
        "certifications": [
            {"name": "BREEAM-NOR Accredited Professional (AP)", "year": "2021"},
            {"name": "PRINCE2 Foundation & Practitioner", "year": "2018"}
        ],
        "projects": [
            {
                "project_name": "RIDABU BARNEHAGE",
                "role": "Prosjektleder",
                "cv_relevance": "Totalansvar for gjennomføring av Hamar kommunes første plusshus-barnehage i massivtre iht. FutureBuilt v2.0. Krevende logistikk med parallell infrastrukturutbygging.",
                "reference_name": "Rune Sandvoll",
                "reference_phone": "911 28 565",
                "role_summary": "Ledet prosjektet fra tilbudsfasen gjennom detaljprosjektering til vellykket overlevering med null feil."
            },
            {
                "project_name": "SKOGMO PARK BARNEHAGE",
                "role": "Prosjektleder",
                "cv_relevance": "Gjennomføring av moderne barnehage med strenge krav til inneklima, robuste materialvalg og utomhusarealer.",
                "reference_name": "Ullensaker kommune v/ prosjektavd.",
                "reference_phone": "66 10 80 00",
                "role_summary": "Kvalitetsstyring, byggherredialog og koordinering mot kommunens brukergrupper."
            }
        ]
    },
    {
        "name": "Lars Erik Halvorsen",
        "title": "Anleggsleder",
        "company": "ØMF Romerike Kongsvinger",
        "email": "leha@omfjeld.no",
        "phone": "982 34 511",
        "image_url": "/static/uploaded_images/emp_lars_halvorsen.jpg",
        "bio": "Lars Erik Halvorsen er en handlekraftig og driftssikker anleggsleder i ØMF Romerike Kongsvinger med tømrerbakgrunn og mer enn 18 års erfaring fra byggeplass. Han er ekspert på logistikkplanlegging i krevende og operative områder, inkludert sikkerhetskontrollerte lufthavnmiljøer og store råbygg. Lars Erik har et brennende engasjement for HMS, LEAN-taktplanlegging og presis leveranse i felt.",
        "languages": ["Norsk (morsmål)", "Engelsk (profesjonelt)"],
        "key_competencies": ["Logistikk i operative soner", "LEAN / Taktplanlegging", "Betong- og stålmontasje", "HMS / SHA-ledelse", "Rigg- og driftsledelse"],
        "educations": [
            {"institution": "Fagskolen Oslo Akershus", "degree": "Fagskoleingeniør Bygg", "time_frame": "2008 – 2010"},
            {"institution": "Opplæringskontoret for Byggfag", "degree": "Fagbrev Tømrerfaget", "time_frame": "2004"}
        ],
        "work_experiences": [
            {"company": "ØMF Romerike Kongsvinger", "title": "Anleggsleder", "time_frame": "2016 – d.d.", "description": "Operativ ledelse på byggeplass, SHA, underentreprenørstyring og fremdriftskontroll."},
            {"company": "AF Gruppen", "title": "Formann / Driftsleder", "time_frame": "2010 – 2016", "description": "Daglig koordinering av tømrer- og betonglag på store næringsbygg."}
        ],
        "certifications": [
            {"name": "Avinor Sikkerhetskort & Kjøretillatelse Flyside", "year": "2022"},
            {"name": "Stillaskontrollør sertifikat", "year": "2020"},
            {"name": "Varmearbeidersertifikat", "year": "2023"}
        ],
        "projects": [
            {
                "project_name": "OSL   UNSØ     (råbygg/   tett  bygg)",
                "role": "Anleggsleder",
                "cv_relevance": "Operativ anleggsledelse under ekstremt strenge sikkerhets- og adgangsrestriksjoner på lufthavnen i full drift. Just-in-time leveranser på trange riggområder.",
                "reference_name": "Avinor v/ prosjektkontor OSL",
                "reference_phone": "64 81 20 00",
                "role_summary": "Ledet daglig produksjon, kran- og løfteoperasjoner og koordinering mot tekniske fag."
            },
            {
                "project_name": "KRØDSHERAD BRANNSTASJON",
                "role": "Anleggsleder",
                "cv_relevance": "Gjennomføring av råbygg og utomhus i vinterforhold, koordinering av port- og utrykningsspesifikke krav for brannvesenet.",
                "reference_name": "Krødsherad kommune v/ teknisk etat",
                "reference_phone": "32 15 00 00",
                "role_summary": "Anleggsledelse for betong, montasje og tett bygg."
            }
        ]
    },
    {
        "name": "Camilla Viken",
        "title": "Prosjektleder",
        "company": "ØMF Asker Ringerike",
        "email": "cavi@omfjeld.no",
        "phone": "924 67 890",
        "image_url": "/static/uploaded_images/emp_camilla_viken.jpg",
        "bio": "Camilla Viken er en strategisk og erfaren prosjektleder i ØMF Asker Ringerike med spesialisering innen samfunnsbygg, omsorgsboliger og beredskapsstasjoner. Hun har solid kompetanse på ombygging i pågående institusjonsdrift, samspillsentrepriser og tett oppfølging av byggherreorganisasjoner. Camilla er anerkjent for sin tydelige kommunikasjon, kommersielle teft og systematiske kvalitetsstyring.",
        "languages": ["Norsk (morsmål)", "Engelsk (flytende)"],
        "key_competencies": ["Helse- og omsorgsbygg", "Ombygging i pågående drift", "Samspillsentreprise", "Risikostyring og endringshåndtering", "NS 8407 / NS 8406"],
        "educations": [
            {"institution": "OsloMet", "degree": "Bachelor i Byggingeniør", "time_frame": "2006 – 2009"},
            {"institution": "Handelshøyskolen BI", "degree": "Videreutdanning i Prosjektledelse", "time_frame": "2014"}
        ],
        "work_experiences": [
            {"company": "ØMF Asker Ringerike", "title": "Prosjektleder", "time_frame": "2018 – d.d.", "description": "Prosjektledelse fra kalkyle/anbud til ferdigstillelse og reklamasjonsfase."},
            {"company": "Skanska Norge", "title": "Prosjektingeniør / Delprosjektleder", "time_frame": "2009 – 2018", "description": "Erfaring med store sykehus- og omsorgsbygg i Oslo-regionen."}
        ],
        "certifications": [
            {"name": "Sertifisert SHA-koordinator (KU/KP)", "year": "2020"},
            {"name": "Miljøfyrtårn-konsulent", "year": "2019"}
        ],
        "projects": [
            {
                "project_name": "BRÅSETVEIEN 10",
                "role": "Prosjektleder",
                "cv_relevance": "Totalansvar for kompleks ombygging av omsorgsboliger for Asker kommune, med strenge krav til beboerhensyn og kontinuerlig drift.",
                "reference_name": "Asker kommune v/ eiendom",
                "reference_phone": "66 70 00 00",
                "role_summary": "Ledet prosjektet med spesiell vekt på brukerdialog, etappevis ferdigstillelse og god logistikk."
            },
            {
                "project_name": "TOFTE BRANNSTASJON",
                "role": "Prosjektleder",
                "cv_relevance": "Gjennomføring av offentlig spesialbygg med høye krav til funksjonalitet, holdbarhet og uttrykningstid.",
                "reference_name": "Asker og Bærum Brannvesen",
                "reference_phone": "66 76 42 00",
                "role_summary": "Overordnet prosjektansvar, økonomistyring og fremdriftskontroll mot oppdragsgiver."
            }
        ]
    },
    {
        "name": "Morten Strand",
        "title": "Anleggsleder",
        "company": "ØMF Evensen & Evensen",
        "email": "most@omfjeld.no",
        "phone": "908 19 324",
        "image_url": "/static/uploaded_images/emp_morten_strand.jpg",
        "bio": "Morten Strand er en solid og løsningsorientert anleggsleder i ØMF Evensen & Evensen med spisskompetanse innen storskala fritidsleiligheter, krevende grunnforhold og vinterbygging i fjellområder. Med bakgrunn som betongfagarbeider og fagskoleingeniør kombinerer han praktisk håndverkserfaring med moderne digital produksjonsstyring. Morten har levert en rekke prestisjeprosjekter på Hafjell med høye krav til overflater og arkitektonisk finish.",
        "languages": ["Norsk (morsmål)", "Engelsk (godt)"],
        "key_competencies": ["Vinterdrift og fjellogistikk", "Prefab- og plasstøpt betong", "Fritidsboligprosjekter i storskala", "Underentreprenørstyring", "Kvalitetskontroll og overlevering"],
        "educations": [
            {"institution": "Gjøvik Fagskole", "degree": "Fagskoleingeniør Bygg og Anlegg", "time_frame": "2009 – 2011"},
            {"institution": "Oppland Fylkeskommune", "degree": "Fagbrev Betongfaget", "time_frame": "2005"}
        ],
        "work_experiences": [
            {"company": "ØMF Evensen & Evensen", "title": "Anleggsleder", "time_frame": "2017 – d.d.", "description": "Byggeplassledelse, taktplanlegging, sikkerhet og fremdrift for store hytte- og leilighetsprosjekter på fjellet."},
            {"company": "Backe Oppland", "title": "Formann Betong", "time_frame": "2011 – 2017", "description": "Drift av betonglag, forskaling og armering på samferdsels- og boligbygg."}
        ],
        "certifications": [
            {"name": "Kompetansebevis Vinterstøp og herdetiltak", "year": "2021"},
            {"name": "Maskinførerbevis (M2, M4)", "year": "2018"},
            {"name": "Førstehjelpsinstruktør bygg/anlegg", "year": "2022"}
        ],
        "projects": [
            {
                "project_name": "FAVN KLYNGETUN (BT 1 OG 2)",
                "role": "Anleggsleder",
                "cv_relevance": "Ledelse av komplekst byggegrop- og betongarbeid i bratt terreng på Hafjell under tøffe vinterforhold. Just-in-time leveranser og krevende riggforhold.",
                "reference_name": "Mosetertoppen Utvikling v/ prosjektsjef",
                "reference_phone": "61 27 40 00",
                "role_summary": "Driftsansvarlig på byggeplass fra råbygg til ferdig innredning og overlevering til kjøpere."
            },
            {
                "project_name": "FAVN CHALET REKKETUN (BT 1 OG 2)",
                "role": "Anleggsleder",
                "cv_relevance": "Gjennomføring av eksklusive fritidsleiligheter med høye krav til lydisolasjon, brannskiller og kombinasjon av massivtre og betong.",
                "reference_name": "Mosetertoppen Utvikling",
                "reference_phone": "61 27 40 00",
                "role_summary": "Daglig ledelse av egne håndverkere og underentreprenører, SHA-oppfølging."
            }
        ]
    },
    {
        "name": "Henrik Solberg",
        "title": "Prosjektleder",
        "company": "ØMF Wito",
        "email": "heso@omfjeld.no",
        "phone": "971 55 432",
        "image_url": "/static/uploaded_images/emp_henrik_solberg.jpg",
        "bio": "Henrik Solberg er en tungt erfaren prosjektleder i ØMF Wito med over 20 års fartstid i entreprenørbransjen. Han har spesialisert seg på sikringsbygg, nødetater og samfunnskritisk infrastruktur med strenge adgangskontroller og graderte sikkerhetskrav. Henrik har dyp innsikt i NS 8407 og tverrfaglige tekniske grensesnitt, og er kjent for sin stødige håndtering av komplekse interessentmiljøer.",
        "languages": ["Norsk (morsmål)", "Engelsk (flytende)"],
        "key_competencies": ["Sikringsbygg og nødetater", "Sikkerhetsgraderte prosjekter (NSM)", "Totalentreprise NS 8407", "Tekniske grensesnitt / BMS", "Offentlige byggherrer"],
        "educations": [
            {"institution": "NTNU Trondheim", "degree": "Sivilingeniør Byggteknikk", "time_frame": "2000 – 2005"},
            {"institution": "Forsvarets Ingeniørhøgskole", "degree": "Befalsskole / Sikkerhetsledelse", "time_frame": "1999"}
        ],
        "work_experiences": [
            {"company": "ØMF Wito", "title": "Prosjektleder / Prosjektsjef", "time_frame": "2015 – d.d.", "description": "Prosjektledelse for politistasjoner, brannstasjoner og beredskapssentre på Østlandet."},
            {"company": "Peab Bygg Norge", "title": "Prosjektleder", "time_frame": "2005 – 2015", "description": "Gjennomføring av offentlige nærings- og samfunnsbygg."}
        ],
        "certifications": [
            {"name": "Sikkerhetsklarert Hemmelig / NATO Secret", "year": "2024"},
            {"name": "BREEAM-NOR Prosjekteringsleder", "year": "2020"},
            {"name": "Avansert Kontraktsrett NS 8407 (JUS)", "year": "2019"}
        ],
        "projects": [
            {
                "project_name": "EDA-EIDSKOG POLITISTASJON",
                "role": "Prosjektleder",
                "cv_relevance": "Totalansvar for bygging av felles norsk-svensk politistasjon på riksgrensen. Svært strenge krav til adgangskontroll, sonedeling og sikkerhet (Politiets Fellestjenester).",
                "reference_name": "Politiets Fellestjenester (PFT)",
                "reference_phone": "23 20 80 00",
                "role_summary": "Ledet prosjektet i samspill med både norske og svenske myndigheter og brukere."
            },
            {
                "project_name": "EIDSKOG BEREDSKAPSSENTER",
                "role": "Prosjektleder",
                "cv_relevance": "Samlokalisering av brannvesen, ambulanse og beredskapsfunksjoner. Strenge krav til funksjonstester, nødstrøm og utrykningslogistikk.",
                "reference_name": "Eidskog kommune v/ eiendomssjef",
                "reference_phone": "62 83 36 00",
                "role_summary": "Overordnet ansvar for prosjektering, bygging og koordinering av spesialtekniske anlegg."
            }
        ]
    },
    {
        "name": "Jonas Bakken",
        "title": "Anleggsleder",
        "company": "Helge Klyve AS",
        "email": "joba@helgeklyve.no",
        "phone": "934 88 120",
        "image_url": "/static/uploaded_images/emp_jonas_bakken.jpg",
        "bio": "Jonas Bakken er en engasjert og driftig anleggsleder i Helge Klyve AS (en del av Ø.M. Fjeld-konsernet) med bakgrunn fra Byggcompaniet og tømrermesterbrev. Han har omfattende erfaring fra store næringsbygg, bilvarehus og kombinerte bolig/næringsprosjekter. Jonas er en drivkraft for digital byggeplass med bruk av BIM-kiosker og feltverktøy, og utmerker seg ved sitt sterke fokus på ryddige byggeplasser, SHA og tett oppfølging av sideentrepriser.",
        "languages": ["Norsk (morsmål)", "Engelsk (godt)"],
        "key_competencies": ["Nærings- og bilvarehus", "BIM i felt / VDC", "Glass- og fasadesystemer", "Tømrer- og innredningsledelse", "Grensesnitt mot sideentreprenører"],
        "educations": [
            {"institution": "Mesterbrevnemnda", "degree": "Mesterbrev i Tømrerfaget", "time_frame": "2014"},
            {"institution": "Fagskolen i Telemark", "degree": "Fagskoleingeniør Bygg", "time_frame": "2010 – 2012"},
            {"institution": "Vestfold Fylkeskommune", "degree": "Fagbrev Tømrer", "time_frame": "2007"}
        ],
        "work_experiences": [
            {"company": "Helge Klyve AS", "title": "Anleggsleder", "time_frame": "2017 – d.d.", "description": "Anleggsledelse for forretnings- og boligprosjekter i Telemark, Vestfold og Viken."},
            {"company": "Byggcompaniet", "title": "Formann / Tømrer", "time_frame": "2007 – 2017", "description": "Praktisk formannsrolle med ansvar for tømrerlag og montasje av store fasade- og takelementer."}
        ],
        "certifications": [
            {"name": "VDC Certified (Virtual Design and Construction)", "year": "2021"},
            {"name": "Arbeidsvarsling Kurs 1 & 2", "year": "2023"},
            {"name": "Personløfter / Liftførerbevis", "year": "2019"}
        ],
        "projects": [
            {
                "project_name": "BNH BIRGER N. HAUG",
                "role": "Anleggsleder",
                "cv_relevance": "Gjennomføring av topp moderne bilforhandler og verkstedanlegg på Rud i Bærum. Omfattende koordinering av oljeutskillere, tunge tekniske installasjoner og showroom-fasader.",
                "reference_name": "Birger N. Haug Eiendom",
                "reference_phone": "67 17 60 00",
                "role_summary": "Anleggsleder med totalansvar for feltproduksjon, fremdriftsplan og SHA."
            },
            {
                "project_name": "ARENARENA",
                "role": "Anleggsleder",
                "cv_relevance": "Kombinasjonsbygg bolig/næring på Rena. Prefabrikkerte elementer, trange riggforhold og grensesnitt mot omkringliggende infrastruktur.",
                "reference_name": "Åmot kommune / Rena Utvikling",
                "reference_phone": "62 43 40 00",
                "role_summary": "Styring av betong- og tømrerentrepriser samt HMS på byggeplass."
            }
        ]
    }
]

def seed_environment(base_url, name):
    print(f"\n================ Seeding {name}: {base_url} ================")
    
    # 1. Fetch projects to map name -> id
    proj_res = requests.get(f"{base_url}/projects/")
    if proj_res.status_code != 200:
        print(f"Failed to fetch projects from {base_url}: {proj_res.status_code}")
        return
    
    projects_by_name = {p["name"]: p["id"] for p in proj_res.json()}
    
    # 2. Fetch existing employees to avoid duplicate creation
    existing_res = requests.get(f"{base_url}/employees/")
    existing_names = {e["name"]: e["id"] for e in existing_res.json()} if existing_res.status_code == 200 else {}
    
    for c in CANDIDATES:
        c_name = c["name"]
        emp_payload = {
            "name": c["name"],
            "title": c["title"],
            "company": c["company"],
            "email": c["email"],
            "phone": c["phone"],
            "image_url": c["image_url"],
            "bio": c["bio"],
            "languages": c["languages"],
            "key_competencies": c["key_competencies"],
            "educations": c["educations"],
            "work_experiences": c["work_experiences"],
            "certifications": c["certifications"]
        }
        
        if c_name in existing_names:
            emp_id = existing_names[c_name]
            update_res = requests.put(f"{base_url}/employees/{emp_id}", json=emp_payload)
            print(f"Updated employee {c_name} (ID {emp_id}): {update_res.status_code}")
        else:
            create_res = requests.post(f"{base_url}/employees/", json=emp_payload)
            if create_res.status_code in [200, 201]:
                emp_id = create_res.json()["id"]
                print(f"Created employee {c_name} (ID {emp_id}): 200 OK")
            else:
                print(f"Failed to create {c_name}: {create_res.status_code} {create_res.text[:100]}")
                continue
                
        # Link project team members
        for p_link in c["projects"]:
            p_name = p_link["project_name"]
            p_id = projects_by_name.get(p_name)
            if not p_id:
                print(f"  Warning: Project '{p_name}' not found on {name}")
                continue
            
            # Check if team member already exists on project
            p_detail = requests.get(f"{base_url}/projects/{p_id}").json()
            existing_tm = [tm for tm in p_detail.get("team_members", []) if tm.get("employee_id") == emp_id]
            
            if not existing_tm:
                tm_payload = {
                    "employee_id": emp_id,
                    "role": p_link["role"],
                    "cv_relevance": p_link.get("cv_relevance"),
                    "reference_name": p_link.get("reference_name"),
                    "reference_phone": p_link.get("reference_phone"),
                    "role_summary": p_link.get("role_summary")
                }
                tm_res = requests.post(f"{base_url}/projects/{p_id}/team", json=tm_payload)
                print(f"  Linked {c_name} -> {p_name}: {tm_res.status_code}")
            else:
                print(f"  Already linked: {c_name} -> {p_name}")

if __name__ == "__main__":
    LOCAL_URL = "http://localhost:8001"
    CLOUD_URL = "https://prosjektbank-backend-rmp63il3jq-lz.a.run.app"
    
    seed_environment(LOCAL_URL, "LOCAL BACKEND")
    seed_environment(CLOUD_URL, "CLOUD BACKEND")
