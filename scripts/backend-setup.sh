#!/usr/bin/env bash
# First-time Django backend setup
set -e
cd "$(dirname "$0")/../backend"

echo "Creating virtualenv..."
python3 -m venv .venv

echo "Installing dependencies..."
.venv/bin/pip install -r requirements.txt -q

echo "Applying migrations..."
DJANGO_SETTINGS_MODULE=config.settings .venv/bin/python manage.py migrate

echo "Done. Create a superuser with:"
echo "  DJANGO_SETTINGS_MODULE=config.settings .venv/bin/python manage.py createsuperuser"
