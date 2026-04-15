#!/bin/sh
set -e

# Run migrations, collectstatic and start gunicorn
echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting gunicorn..."
# Ensure MinIO bucket exists when using MinIO
python - <<'PY'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','settings')
from django.conf import settings
if getattr(settings, 'USE_MINIO', False):
    try:
        from core.minio import ensure_bucket_exists
        ensure_bucket_exists()
    except Exception:
        pass
PY
exec gunicorn wsgi:application --bind 0.0.0.0:8000
