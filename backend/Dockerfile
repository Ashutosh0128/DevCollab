FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root system user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Shell-form CMD ensures ${WEB_CONCURRENCY:-1} is dynamically expanded at container runtime
CMD gunicorn devcollab.wsgi:application --bind 0.0.0.0:8000 --workers ${WEB_CONCURRENCY:-1}
