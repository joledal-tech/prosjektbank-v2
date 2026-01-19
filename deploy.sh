#!/bin/bash
# Deploy script for Prosjektbank v2 to Google Cloud Run
# This script builds and deploys both backend and frontend services

set -e

# Configuration
PROJECT_ID="prosjektbank-v2"
REGION="europe-north1"
ARTIFACT_REPO="prosjektbank-repo"
BACKEND_SERVICE="prosjektbank-backend"
FRONTEND_SERVICE="prosjektbank-frontend"
DB_INSTANCE="prosjektbank-v2:europe-north1:prosjektbank-db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Prosjektbank v2 Deployment ===${NC}"
echo -e "Project: ${PROJECT_ID}"
echo -e "Region: ${REGION}"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth print-identity-token &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with gcloud. Run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Set the project
gcloud config set project ${PROJECT_ID}

# Configure Docker for Artifact Registry
echo -e "${YELLOW}Configuring Docker for Artifact Registry...${NC}"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build Backend
echo -e "${YELLOW}Building backend Docker image...${NC}"
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${BACKEND_SERVICE}:latest ./backend

# Push Backend
echo -e "${YELLOW}Pushing backend image to Artifact Registry...${NC}"
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${BACKEND_SERVICE}:latest

# Deploy Backend to Cloud Run
echo -e "${YELLOW}Deploying backend to Cloud Run...${NC}"
gcloud run deploy ${BACKEND_SERVICE} \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${BACKEND_SERVICE}:latest \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --add-cloudsql-instances ${DB_INSTANCE} \
    --set-env-vars "INSTANCE_CONNECTION_NAME=${DB_INSTANCE},DB_NAME=prosjektbank,DB_USER=postgres" \
    --set-secrets "DB_PASS=db-password:latest" \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 3

# Get Backend URL
BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE} --region ${REGION} --format 'value(status.url)')
echo -e "${GREEN}Backend deployed at: ${BACKEND_URL}${NC}"

# Build Frontend with Backend URL
echo -e "${YELLOW}Building frontend Docker image...${NC}"
docker build \
    --build-arg NEXT_PUBLIC_API_URL=${BACKEND_URL} \
    -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${FRONTEND_SERVICE}:latest \
    ./frontend

# Push Frontend
echo -e "${YELLOW}Pushing frontend image to Artifact Registry...${NC}"
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${FRONTEND_SERVICE}:latest

# Deploy Frontend to Cloud Run
echo -e "${YELLOW}Deploying frontend to Cloud Run...${NC}"
gcloud run deploy ${FRONTEND_SERVICE} \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${FRONTEND_SERVICE}:latest \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 3

# Get Frontend URL
FRONTEND_URL=$(gcloud run services describe ${FRONTEND_SERVICE} --region ${REGION} --format 'value(status.url)')
echo -e "${GREEN}Frontend deployed at: ${FRONTEND_URL}${NC}"

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "Backend:  ${BACKEND_URL}"
echo -e "Frontend: ${FRONTEND_URL}"
