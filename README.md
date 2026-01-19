# Prosjektbank v2

Prosjektbank for Ø.M. Fjeld – et system for å administrere prosjekter, ansatte og CV-er.

## Kjøre lokalt

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment

Appen deployes automatisk til Google Cloud Run via GitHub Actions.

- **Frontend:** <https://prosjektbank-web-xxxxx.run.app>
- **Backend API:** <https://prosjektbank-api-xxxxx.run.app>
