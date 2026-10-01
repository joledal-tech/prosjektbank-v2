# Project Setup - Prosjektbank / Referansebank v2

## Filstruktur og mappeorganisering

- `backend/`: Python FastAPI backend (`main.py`, `models.py`, `schemas.py`, `crud.py`, `database.py`).
- `backend/static/`: Opplastede bilder og vedlegg.
- `backend/venv/`: Lokalt virtuelt Python-miljø (Python 3.14).
- `frontend/`: Next.js (Turbopack, Tailwind CSS) webapplikasjon.
- `docker-compose.yml`: Oppsett for lokal PostgreSQL-database og container-kjøring.

## Database-oppsett

- **Type**: PostgreSQL 15.
- **Lokal database**: Docker container `prosjektbank_db` på port 5432 (`postgresql://user:password@localhost:5432/prosjektbank`).
- **Tilkobling**: `backend/database.py` håndterer tilkobling via standard `DATABASE_URL` lokalt eller Unix socket mot Cloud SQL i skyen.
- **Modeller**: `backend/models.py` definerer SQLAlchemy-modeller.
- **Migrasjoner**: Kjøres automatisk ved oppstart i `backend/main.py:run_migrations()`.

## Eksterne tjenester og APIer

- **Google Cloud Run**: 
  - Frontend: `https://prosjektbank-frontend-rmp63il3jq-lz.a.run.app`
  - Backend API: `https://prosjektbank-backend-rmp63il3jq-lz.a.run.app`
- **Google Cloud SQL**: PostgreSQL-instans `prosjektbank-v2:europe-north1:prosjektbank-db`.
- **OpenAI API**: Brukes for parsing og tekstuthenting i `backend/utils/`.

## Miljøvariabler og konfigurasjon

- `DATABASE_URL`: Tilkoblingsstreng til PostgreSQL (fallback: `postgresql://user:password@localhost/prosjektbank`).
- `INSTANCE_CONNECTION_NAME`: Cloud SQL-instansnavn ved kjøring i Cloud Run.
- `OPENAI_API_KEY`: API-nøkkel for OpenAI i `backend/.env`.
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend (fallback til `http://localhost:8001` lokalt).

## Lokale vs. sky-baserte ressurser

- **Lokalt**:
  - PostgreSQL i Docker (`prosjektbank_db`, port 5432).
  - FastAPI backend (`http://localhost:8001`).
  - Next.js frontend (`http://localhost:3001`).
- **Sky**:
  - Google Cloud Platform (prosjekt `prosjektbank-v2`, region `europe-north1`).

## Deployment-prosedyrer og URLs

- **Deploy script**: `./deploy.sh` (bygger Docker images, pusher til Artifact Registry og oppdaterer Cloud Run-tjenestene).
- **Produksjons-URLs**:
  - Frontend: [https://prosjektbank-frontend-rmp63il3jq-lz.a.run.app](https://prosjektbank-frontend-rmp63il3jq-lz.a.run.app)
  - Backend API: [https://prosjektbank-backend-rmp63il3jq-lz.a.run.app](https://prosjektbank-backend-rmp63il3jq-lz.a.run.app)
  - API Dokumentasjon (Swagger): [https://prosjektbank-backend-rmp63il3jq-lz.a.run.app/docs](https://prosjektbank-backend-rmp63il3jq-lz.a.run.app/docs)

## Porter og tjenester som kjører lokalt

- **Frontend**: Port `3001` (`http://localhost:3001`) – `npm run dev` i `frontend/`
- **Backend**: Port `8001` (`http://localhost:8001`) – `uvicorn main:app --reload --port 8001` i `backend/`
- **Database**: Port `5432` – Docker container `prosjektbank_db`
