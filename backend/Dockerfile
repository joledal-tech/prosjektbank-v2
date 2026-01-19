FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PDF processing and OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-nor \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy application code
COPY . .

# Create static directory if it doesn't exist
RUN mkdir -p static

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Use gunicorn with uvicorn workers for production
CMD exec gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker -b :${PORT:-8080}
