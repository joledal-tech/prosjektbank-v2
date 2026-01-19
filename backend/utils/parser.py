
import re
import os
import uuid
from io import BytesIO
import pdfplumber
import pytesseract
from PIL import Image
from pypdf import PdfReader # Keep for image extraction

def parse_pdf(file_content: bytes) -> dict:
    text = ""
    
    # --- STAGE 1: TEXT EXTRACTION (pdfplumber + OCR) ---
    try:
        with pdfplumber.open(BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                # Use layout=True to preserve visual columns
                page_text = page.extract_text(layout=True)
                
                # Heuristic: If page text is very short/empty, likely an image-only PDF
                if not page_text or len(page_text.strip()) < 100:
                    try:
                        # Attempt OCR
                        # Render page to image (300 DPI is good for OCR)
                        pim = page.to_image(resolution=300)
                        pil_image = pim.original
                        # Use Norwegian ("nor") if available, fallback to eng
                        try:
                            ocr_text = pytesseract.image_to_string(pil_image, lang='nor')
                        except:
                            # Fallback if 'nor' not installed (though we installed it)
                            ocr_text = pytesseract.image_to_string(pil_image)
                        
                        text += ocr_text + "\n"
                    except Exception as e:
                        print(f"OCR Failed for page: {e}")
                        # Fallback to whatever text we had
                        if page_text:
                            text += page_text + "\n"
                else:
                    text += page_text + "\n"

    except Exception as e:
        print(f"pdfplumber failed: {e}")
        # Massive fallback?
        return {}

    # Log text for debug
    try:
        with open("debug_parsed_text.txt", "w") as f:
            f.write(text)
    except:
        pass

    extracted = {}
    lines = [line.strip() for line in text.split('\n')]
    
    # --- HELPER FUNCTIONS ---
    def find_next_line_value(keywords: list, lines: list):
        for i, line in enumerate(lines):
            line_clean = line.strip()
            line_lower = line_clean.lower()
            
            for kw in keywords:
                # Case 1: LINE STARTS WITH KEYWORD
                if line_lower.startswith(kw.lower()):
                    # 1a. Check same line (after colon)
                    if ":" in line_clean:
                        parts = line_clean.split(":", 1)
                        if len(parts) > 1 and parts[1].strip():
                            return parts[1].strip()
                    # 1b. Return next line if available
                    if i + 1 < len(lines):
                        val = lines[i+1].strip()
                        if val: return val

                # Case 2: LINE ENDS WITH KEYWORD (Layout mode artifact)
                # "Some text description...       Tid for utførelse"
                # Value is on next line
                if line_lower.endswith(kw.lower()):
                    if i + 1 < len(lines):
                         val_line = lines[i+1].strip()
                         if not val_line: continue
                         
                         # Check if next line is also columnar (has gap)
                         # "plassbygde yttervegger...      Totalentreprise"
                         parts = re.split(r"\s{4,}", val_line)
                         if len(parts) > 1:
                             # Assume value is on the right
                             return parts[-1].strip()
                         
                         # If no gap, but line is long, it might be description on left + value on right with small gap?
                         # Or just value?
                         # Safe check: if it matches known values?
                         if "entreprise" in kw.lower():
                             if "totalentreprise" in val_line.lower(): return "Totalentreprise"
                             if "generalentreprise" in val_line.lower(): return "Generalentreprise"
                             if "hovedentreprise" in val_line.lower(): return "Hovedentreprise"
                         
                         return val_line
                         
                # Case 3: Keyword appears with large whitespace before it in line
                # "Description text        Type" -> Value checking on same line or next?
                # Usually if "Type" is at end, value is next line.
                
        return None

    def find_value_regex(keywords: list, text: str):
        for keyword in keywords:
            pattern = re.compile(rf"(?<!\w){re.escape(keyword)}[\s\.:\-_]+([^\n]+)", re.IGNORECASE)
            match = pattern.search(text)
            if match:
                return match.group(1).strip()
        return None

    # --- EXTRACTION LOGIC ---

    # Location
    extracted['location'] = find_next_line_value(["Sted", "Beliggenhet", "Adresse"], lines)
    if not extracted['location']:
        extracted['location'] = find_value_regex(["Sted", "Beliggenhet"], text)

    # Type
    extracted['type'] = find_next_line_value(["Prosjekttype", "Type", "Kategori"], lines)
    if not extracted['type']:
         # Try looking for "Type" header pattern in layout mode often it's "Type      \n     Bolig"
         extracted['type'] = find_value_regex(["Prosjekttype", "Type", "Kategori"], text)
    
    # Time Frame
    extracted['time_frame'] = find_next_line_value(["Tid for utførelse", "Tidspunkt", "Byggeperiode", "Ferdigstillelse", "Tidsrom"], lines)
    # OCR often messes up dates like "2020 - 2022" -> "2020 — 2022" or similar. Logic below handles raw string which is fine.

    # Contract Type
    extracted['contract_type'] = find_next_line_value(["Entrepriseform", "Kontraktsform", "Entreprise", "Totalentreprise"], lines)
    if not extracted['contract_type']:
        # Sometimes 'Totalentreprise' stands alone as a value-like header?
        # Or check if "Totalentreprise" is in the text as a discrete word near headers
        if "Totalentreprise" in text:
             extracted['contract_type'] = "Totalentreprise"
             
    if extracted['contract_type']:
        extracted['contract_type'] = extracted['contract_type'].replace("T otalentreprise", "Totalentreprise")
        extracted['contract_type'] = extracted['contract_type'].replace("G eneralentreprise", "Generalentreprise")

    # Performed By
    extracted['performed_by'] = find_next_line_value(["Utført av"], lines)

    # Area
    area_val = find_next_line_value(["Areal", "BTA", "BRA", "Volum/areal", "Volum"], lines)
    if not area_val:
         area_val = find_value_regex(["Areal", "BTA", "BRA"], text)
         
    if area_val:
        # OCR Cleanup: "5.5570 m*" -> "5570" or "5 570"
        # Aggressive cleanup: remove non-digits first, but keep dot/comma if potentially decimal
        try:
             # Remove "m2", "kvm" etc
             clean_a = re.sub(r"(?i)m2|kvm|\*", "", area_val)
             # Remove dots and spaces
             clean_a = clean_a.replace(".", "").replace(" ", "").replace(",", "")
             # Only digits left?
             clean_a = re.sub(r"\D", "", clean_a)
             
             if clean_a:
                extracted['area_m2'] = int(clean_a)
        except:
            pass
    
    # Fallback Area from Text (e.g. "bruttoareal på 1523 m²")
    if not extracted.get('area_m2'):
        # Look for pattern: number followed by m2/kvm
        # Allow spaces/dots in number: 1 500, 1.500
        area_match = re.search(r"(\d[\d\s\.]*)\s?(?:m²|m2|kvm)", text, re.IGNORECASE)
        if area_match:
            try:
                raw_a = area_match.group(1).replace(" ", "").replace(".", "")
                extracted['area_m2'] = int(raw_a)
            except: pass

    # Contract Value
    val_mnok = find_next_line_value(["Kontraktsverdi", "Kontraktssum", "Byggekostnad", "Verdi", "Kontraktssum"], lines)
    if not val_mnok:
        val_mnok = find_value_regex(["Kontraktsverdi", "Verdi", "Sum", "Kontraktssum"], text)

    # Heuristic for multi-line values in OCR (e.g. "Bt 1; 107 MNOK")
    if val_mnok:
         # Try to find specific MNOK pattern within the retrieved value string
         # "Bt 1; 107 MNOK"
         mnok_match = re.fullmatch(r".*?(\d[\d\s.,]*)\s?(?:MNOK|Mill).*", val_mnok, re.IGNORECASE)
         if mnok_match:
             # If we matched a specific number associated with MNOK, use that
             val_mnok = mnok_match.group(1)
         
         # Clean
         val_clean = val_mnok.lower().replace("mnok", "").replace("milj", "").replace("mill", "").replace(" ", "").replace(",", ".")
         # extract all numbers
         nums = re.findall(r"(\d+(?:\.\d+)?)", val_clean)
         if nums:
             # Heuristic: Pick the largest number found? 
             # "Bt 1; 107" -> 1, 107. 107 is likely the value.
             vals = []
             for n in nums:
                 try:
                     parts = float(n)
                     if parts > 1000: parts = parts / 1_000_000
                     vals.append(parts)
                 except: pass
             
             if vals:
                 # Filter out suspiciously small values (like "1" building number) if we have larger ones
                 # But valid values can be small (0.5 MNOK).
                 # If we have multiple, and one is clearly "value-like" (> 5?)
                 distinct_vals = sorted(vals, reverse=True)
                 extracted['contract_value_mnok'] = round(distinct_vals[0], 2)
    
    # Deep fallback: Search for "X MNOK" anywhere if we don't have a good value yet
    # Or if the current value seems wrong (like 1.0)
    if not extracted.get('contract_value_mnok') or extracted.get('contract_value_mnok') == 1.0:
        # Look for the largest MNOK value in the text
        all_mnok_matches = re.findall(r"(\d[\d\s.,]*)\s?(?:MNOK|Mill(?:\.|ioner))", text, re.IGNORECASE)
        best_val = 0
        for m in all_mnok_matches:
            try:
                vc = m.lower().replace(" ", "").replace(",", ".")
                vf = float(vc)
                if vf > 1000: vf = vf / 1_000_000
                if vf > best_val:
                    best_val = vf
            except: pass
        if best_val > 0:
            extracted['contract_value_mnok'] = round(best_val, 2)

    # Client/Contact
    contact_block_start = -1
    for i, line in enumerate(lines):
        if "oppdragsgiver" in line.lower() or "byggherre" in line.lower():
            contact_block_start = i
            break
            
    if contact_block_start != -1:
        if contact_block_start + 1 < len(lines):
            extracted['client'] = lines[contact_block_start + 1].strip()
        for j in range(contact_block_start + 2, min(contact_block_start + 6, len(lines))):
            val = lines[j].strip()
            if not val: continue
            if len(val) > 100: break 
            
            if re.match(r"^(v\/|v\s+|\/)", val, re.IGNORECASE):
                extracted['contact_person'] = re.sub(r"^(v\/|v\s+|\/)", "", val, flags=re.IGNORECASE).strip().rstrip(",")
                continue
            
            # Check for Byggherres representant ONLY (User feedback: Prosjektleder is internal)
            if "byggherres representant" in val.lower() or "representant" in val.lower():
                 parts = val.split(":")
                 if len(parts) > 1:
                     extracted['contact_person'] = parts[1].strip()
                     continue

            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", val)
            if email_match: extracted['contact_email'] = email_match.group(0)
            
            phone_match = re.search(r"(?:tlf\.?|t\.?|m\.?)\s*([\d\s]+)", val, re.IGNORECASE)
            if phone_match: extracted['contact_phone'] = phone_match.group(1).strip()
    
    # Fallback scanning for Byggherres representant anywhere
    if not extracted.get('contact_person'):
        pl_val = find_next_line_value(["Byggherres representant", "Kontaktperson"], lines)
        if pl_val: extracted['contact_person'] = pl_val

    if not extracted.get('client'):
        extracted['client'] = find_next_line_value(["Oppdragsgiver", "Byggherre", "Oppdragsgiver/kontakt"], lines)

    # Name: First non-junk line
    # Refined: Ignore lines that are too short or mostly symbols
    for i, line in enumerate(lines[:15]):
        L = line.upper()
        if "PROSJEKTREFERANSE" in L: continue
        if "Ø.M. FJELD" in L: continue
        if "OMFJELD.NO" in L: continue
        
        # Check for junk
        clean_l = line.strip()
        if len(clean_l) < 3: continue
        if not re.search(r'[a-zA-Z]{2,}', clean_l): continue # Must have at least 2 consecutive letters
        if "/ 11)" in clean_l: continue # Specific noise filter
        
        extracted['name'] = clean_l
        break
    
    # Description
    def find_description(lines, extracted_data):
        # 1. Try to find a distinct "BESKRIVELSE" header
        start_idx = -1
        for i, line in enumerate(lines):
            if line.strip().upper() in ["BESKRIVELSE", "KORT OM PROSJEKTET", "PROSJEKTBESKRIVELSE"]:
                start_idx = i
                break
        
        if start_idx != -1:
            # Capture everything until next likely header or huge gap
            desc_lines = []
            # Stop keywords (headers)
            stop_keywords = [
                "PROSJEKTFAKTA", "FAKTA", "BELIGGENHET", "ADRESSE", "STED", "KONTAKT", "OPPDRAGSGIVER", "BYGGHERRE",
                "VOLUM/AREAL", "KONTRAKTSVERDI", "ENTREPRISE", "TID FOR", "UTFØRT AV"
            ]
            
            for j in range(start_idx + 1, len(lines)):
                line = lines[j].strip()
                if not line: continue
                
                # Check if matches a stop keyword
                is_stop = False
                for kw in stop_keywords:
                    # Check startswith
                    if line.upper().startswith(kw):
                        is_stop = True
                        break
                    # Check contains word (if it's a strong keyword like PROSJEKTFAKTA)
                    if "PROSJEKTFAKTA" in line.upper(): is_stop = True; break
                    
                if is_stop: break
                
                # Filter out junk/metadata lines likely to appear
                if "M. FJELD" in line.upper(): continue
                if line.startswith("img_"): continue
                
                desc_lines.append(line)
            
            if desc_lines:
                return "\n".join(desc_lines)

        # 2. Fallback: Old Logic (Look for block between Name and Metadata keys)
        try:
            name_idx = -1
            end_idx = -1
            if extracted_data.get('name'):
                 for i, line in enumerate(lines):
                     if line == extracted_data['name']:
                         name_idx = i
                         break
            
            # If name not found, assume description starts after top metadata block (if any)
            start_search_idx = name_idx + 1 if name_idx != -1 else 0
            
            # Improved Block Search:
            # Look for lines that carry "heavy" content (sentence structure) vs short metadata lines
            # If we don't find a header, we look for the biggest block of text.
            
            current_block = []
            blocks = []
            
            stop_keys_regex = re.compile(r"^(Type|Sted|Beskrivelse|Tid|Entreprise|Adresse|Kategori|Utført|Volum|Areal|Kontrakt|Oppdrags)", re.IGNORECASE)
            
            for i in range(start_search_idx, len(lines)):
                 line = lines[i].strip()
                 if not line: 
                     if current_block: 
                         blocks.append(current_block)
                         current_block = []
                     continue
                 
                 # Check if line is metadata start
                 if ":" in line or stop_keys_regex.match(line):
                     if current_block:
                         blocks.append(current_block)
                         current_block = []
                     continue
                 
                 current_block.append(line)
            
            if current_block: blocks.append(current_block)
            
            # Select the block with the most characters that doesn't look like noise
            best_block = []
            max_len = 0
            
            for b in blocks:
                content = "\n".join(b)
                # Heuristic: Description usually has typical sentence length or tokens
                if len(content) > max_len and len(content) > 50:
                    # Double check it isn't just list of names (Prosjektleder: ...)
                    if "Prosjektleder" not in content and "MNOK" not in content:
                        max_len = len(content)
                        best_block = b
            
            if best_block:
                return "\n".join(best_block)

            # --- ORIGINAL FALLBACK (Kept for safety but lower priority if block found) ---
            if name_idx != -1:
                 desc_candidates = []
                 for i in range(name_idx + 1, len(lines)):
                     line = lines[i]
                     # ... (Keep existing logic if we want, or replace. The block logic above is better for headless).
                     pass
                     
        except Exception as e:
            print(f"Fallback description failed: {e}")
            pass
            
        return ""

    extracted['description'] = find_description(lines, extracted)


    # --- STAGE 2: IMAGE EXTRACTION (pypdf) ---
    # We use pypdf because it's good at extracting raw embedded image streams.
    # pdfplumber extracts cropped bitmaps which is slower/worse for "original photo" recovery.
    extracted_images = []
    output_dir = "static/uploaded_images"
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        reader = PdfReader(BytesIO(file_content))
        for page in reader.pages:
            for image_file_object in page.images:
                try:
                    # Filter: ignore small images (< 10KB) or small dimensions
                    if len(image_file_object.data) < 10240: continue
                    
                    image = Image.open(BytesIO(image_file_object.data))
                    w, h = image.size
                    if w < 200 or h < 200: continue
                    
                    # Entropy / White check
                    # Convert to grayscale
                    gray = image.convert("L")
                    # Check entropy (amount of information)
                    entropy = gray.entropy()
                    # Blank/solid color images have very low entropy (near 0)
                    if entropy < 1.0: 
                        print(f"Skipping low entropy image (blank): {entropy}")
                        continue
                    
                    # Also check for transparency?
                    if image.mode == 'RGBA':
                        extrema = image.getextrema()
                        if extrema[3][0] == 0 and extrema[3][1] == 0:
                             print("Skipping fully transparent image")
                             continue
                    
                    # --- SMART CROP LOGIC ---
                    try:
                        # Analyze image for text overlap
                        # We use a fast configuration for OCR
                        ocr_data = pytesseract.image_to_data(image, lang='nor', output_type=pytesseract.Output.DICT)
                        n_boxes = len(ocr_data['text'])
                        
                        min_y_cutoff = h # Default to full height
                        max_y_start = 0  # Default to top
                        
                        has_cutoff = False
                        has_start_trim = False
                        
                        keywords_cutoff = ["Type", "Sted", "Bygging", "Beskrivelse", "Areal", "Kontraktsverdi", "Entreprise"]
                        # Check for title to trim top
                        title_words = extracted.get('name', '').split()[:2] # First 2 words of title
                        
                        for i in range(n_boxes):
                            text = ocr_data['text'][i].strip()
                            if len(text) < 3: continue
                            
                            top = ocr_data['top'][i]
                            height = ocr_data['height'][i]
                            bottom = top + height
                            
                            # check for cutoff keywords
                            for kw in keywords_cutoff:
                                if kw.lower() in text.lower():
                                    if top < min_y_cutoff:
                                        min_y_cutoff = top
                                        has_cutoff = True
                            
                            # check for title overlap (trim top)
                            if title_words:
                                for tw in title_words:
                                    if tw.lower() in text.lower() and top < h * 0.2: # Title usually in top 20%
                                        if bottom > max_y_start:
                                            max_y_start = bottom
                                            has_start_trim = True

                        if has_cutoff or has_start_trim:
                            # Apply crop
                            # Add some margin
                            crop_top = max_y_start + 10 if has_start_trim else 0
                            crop_bottom = min_y_cutoff - 10 if has_cutoff else h
                            
                            if crop_bottom - crop_top > 100: # Ensure we don't crop everything
                                image = image.crop((0, crop_top, w, crop_bottom))
                                
                    except Exception as e:
                        print(f"Smart crop failed: {e}")

                    # --- RECURSIVE SPLIT LOGIC ---
                    
                    def split_recursive(img):
                        """Recursively split image by white gaps."""
                        # Simplified to just return img if simple
                        # (Keeping your complex logic but verifying split chunks)
                        try:
                            import numpy as np
                            if img.mode != "RGB": img = img.convert("RGB")
                            arr = np.array(img)
                            
                            h, w, _ = arr.shape
                            GAP_THRESH = 250
                            MIN_GAP = 10
                            MIN_IMG_SIZE = 50
                            
                            # 1. Check Vertical Gaps (Split columns)
                            col_avg = np.mean(arr, axis=0) # (width, 3)
                            col_brightness = np.mean(col_avg, axis=1) # (width,)
                            
                            v_gaps = []
                            is_gap = False
                            gap_start = 0
                            
                            for x, b in enumerate(col_brightness):
                                if b > GAP_THRESH:
                                    if not is_gap: is_gap = True; gap_start = x
                                else:
                                    if is_gap:
                                        is_gap = False
                                        if x - gap_start > MIN_GAP: v_gaps.append((gap_start, x))
                            
                            if v_gaps:
                                chunks = []
                                last_x = 0
                                for gs, ge in v_gaps:
                                    if gs - last_x > MIN_IMG_SIZE: chunks.append(img.crop((last_x, 0, gs, h)))
                                    last_x = ge
                                if w - last_x > MIN_IMG_SIZE: chunks.append(img.crop((last_x, 0, w, h)))
                                
                                if len(chunks) > 1:
                                    result = []
                                    for c in chunks: result.extend(split_recursive(c))
                                    return result

                            # 2. Check Horizontal Gaps (Split rows)
                            row_avg = np.mean(arr, axis=1) # (height, 3)
                            row_brightness = np.mean(row_avg, axis=1) # (height,)
                            
                            h_gaps = []
                            is_gap = False
                            gap_start = 0
                            
                            for y, b in enumerate(row_brightness):
                                if b > GAP_THRESH:
                                    if not is_gap: is_gap = True; gap_start = y
                                else:
                                    if is_gap:
                                        is_gap = False
                                        if y - gap_start > MIN_GAP: h_gaps.append((gap_start, y))
                            
                            if h_gaps:
                                chunks = []
                                last_y = 0
                                for gs, ge in h_gaps:
                                    if gs - last_y > MIN_IMG_SIZE: chunks.append(img.crop((0, last_y, w, gs)))
                                    last_y = ge
                                if h - last_y > MIN_IMG_SIZE: chunks.append(img.crop((0, last_y, w, h)))
                                
                                if len(chunks) > 1:
                                    result = []
                                    for c in chunks: result.extend(split_recursive(c))
                                    return result
                                    
                            return [img]
                            
                        except Exception as e:
                            print(f"Recursive split failed: {e}")
                            return [img]

                    images_to_save = split_recursive(image)

                    # Save extracted images
                    for sub_img in images_to_save:
                        # FILTER: Check size of final chunk
                        sw, sh = sub_img.size
                        if sw < 150 or sh < 150: continue # Skip small icons/fragments
                        
                        ext = os.path.splitext(image_file_object.name)[1]
                        if not ext: ext = ".jpg"
                        
                        filename = f"img_{uuid.uuid4().hex}{ext}"
                        filepath = os.path.join(output_dir, filename)
                        
                        if sub_img.mode != "RGB": sub_img = sub_img.convert("RGB")
                        sub_img.save(filepath, quality=90)
                        
                        extracted_images.append(f"/static/uploaded_images/{filename}")

                except:
                    pass
    except Exception as e:
        print(f"Image extraction warning: {e}")


    # Cleanup Description
    if extracted.get('description'):
        # 1. Remove "Beskrivelse" header if present (case insensitive)
        desc = extracted['description']
        desc = re.sub(r"^(Beskrivelse|Prosjektbeskrivelse|Kort om prosjektet)\s*", "", desc, flags=re.IGNORECASE).strip()
        
        # 2. Remove "Sted" / "Location" if it appears at start (e.g. "BÆRUM")
        if extracted.get('location'):
            loc = extracted['location'].strip()
            # Check if description starts with location (allow some case/whitespace diff)
            if desc.lower().startswith(loc.lower()):
                desc = desc[len(loc):].strip()
        
        extracted['description'] = desc
        lines = extracted['description'].split('\n')
        
        # Heuristic: Check if first line is a "Location Header" (ALL CAPS, short)
        if lines and lines[0].strip().isupper() and len(lines[0].strip()) < 50:
            potential_loc = lines[0].strip()
            # If we don't have a location yet, take this one
            if not extracted.get('location'):
                extracted['location'] = potential_loc
            # Remove it from description if it matches location (which it now does, or did previously)
            if extracted.get('location') and potential_loc == extracted['location']:
                lines = lines[1:] # Remove first line
        
        desc = "\n".join(lines).strip()

        # 3. Clean up line breaks and hyphenation
        # Pattern 1: Hyphen followed by newline and lowercase letter -> Join (remove hyphen)
        # e.g. "sys-\ntem" -> "system"
        desc = re.sub(r'-\n\s*([a-zæøå])', r'\1', desc)
        
        # Pattern 2: Hyphen followed by newline and Uppercase -> Keep hyphen, remove newline
        # e.g. "Sør-\nAfrika" -> "Sør-Afrika"
        desc = re.sub(r'-\n\s*([A-ZÆØÅ])', r'-\1', desc)
        
        # Pattern 3: Join remaining single newlines with space (assuming wrapped text)
        # We try to preserve "double newlines" as paragraphs if they exist, 
        # but often pdfplumber gives single newlines for everything in a block.
        # Let's treat valid end-of-sentence markers + newline as potential paragraph?
        # For now, simple joining is vastly better than broken lines.
        desc = desc.replace('\n', ' ')
        
        # Collapse multiple spaces
        desc = re.sub(r'\s+', ' ', desc).strip()
        
        extracted['description'] = desc
        # Existing Logic: Remove Location if it starts with it (redundant but safe)
        if lines and extracted.get('location'):
            loc = extracted['location'].strip().upper()
            new_lines = []
            for line in lines:
                if line.strip().upper() == loc: continue 
                new_lines.append(line)
            lines = new_lines
            
        extracted['description'] = "\n".join(lines).strip()

    extracted['extracted_images'] = extracted_images
    
    return extracted
