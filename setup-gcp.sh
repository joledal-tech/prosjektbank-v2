#!/bin/bash
# Setup script for initial GCP configuration
# Run this once to configure secrets and database

set -e

PROJECT_ID="prosjektbank-v2"
REGION="europe-north1"
DB_INSTANCE="prosjektbank-db"

echo "=== GCP Initial Setup for Prosjektbank v2 ==="

# Enable Secret Manager API if not already enabled
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project=${PROJECT_ID}

# Create database password secret
echo ""
echo "Creating database password secret..."
echo "Enter your Cloud SQL database password (the one you set when creating the instance):"
read -s DB_PASSWORD

echo -n "${DB_PASSWORD}" | gcloud secrets create db-password \
    --project=${PROJECT_ID} \
    --replication-policy="automatic" \
    --data-file=-

echo "Secret 'db-password' created successfully."

# Grant Cloud Run access to the secret
echo ""
echo "Granting Cloud Run access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding db-password \
    --project=${PROJECT_ID} \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Create the database in Cloud SQL
echo ""
echo "Creating 'prosjektbank' database in Cloud SQL..."
echo "Note: Make sure the Cloud SQL instance is ready before running this."
gcloud sql databases create prosjektbank \
    --instance=${DB_INSTANCE} \
    --project=${PROJECT_ID} \
    --charset=UTF8 \
    --collation=en_US.UTF8 || echo "Database may already exist, continuing..."

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Run './deploy.sh' to build and deploy the application"
echo "2. The database schema will be created automatically on first backend start"
