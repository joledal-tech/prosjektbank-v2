
import os
import re
import json
from io import BytesIO
import pdfplumber
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_cv_pdf(file_content: bytes) -> dict:
    """
    Parses a CV PDF using text extraction followed by AI structuring.
    """
    text = ""
    try:
        with pdfplumber.open(BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
        return {"error": "Could not read PDF content"}

    if not text.strip():
        return {"error": "PDF is empty or contains only images"}

    prompt = f"""
    Du er en ekspert på å tolke norske CV-er for bygg- og anleggsbransjen.
    Vennligst trekk ut informasjon fra følgende CV-tekst og returner den i et strukturert JSON-format.
    
    JSON-formatet skal følge dette skjemaet:
    {{
      "name": "Navn på personen",
      "title": "Nåværende eller mest relevante tittel (f.eks. Prosjektleder)",
      "bio": "En kort, selgende profiltekst i 3. person (100-150 ord)",
      "languages": ["Språk 1", "Språk 2"],
      "key_competencies": ["Kompetanse 1", "Kompetanse 2"],
      "work_experiences": [
        {{ "company": "Selskap", "title": "Rolle", "time_frame": "Periode", "description": "Kort beskrivelse" }}
      ],
      "educations": [
        {{ "institution": "Skole/Univ", "degree": "Grad", "time_frame": "Periode", "location": "Sted (valgfritt)" }}
      ]
    }}

    REGLER:
    1. Språket i JSON skal være norsk.
    2. Bio skal skrives profesjonelt og appellere til byggherrer.
    3. Hvis du mangler informasjon for et felt, la det være en tom liste eller null.

    CV TEKST:
    {text}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Du er en assistent som kun svarer i valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.2
        )
        
        extracted_data = json.loads(response.choices[0].message.content)
        return extracted_data
    except Exception as e:
        print(f"AI CV Parsing failed: {e}")
        return {"error": f"AI parsing failed: {str(e)}"}
