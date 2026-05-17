#!/usr/bin/env bash
# Start Django dev server (foreground)
set -e
cd "$(dirname "$0")/../backend"
DJANGO_SETTINGS_MODULE=config.settings .venv/bin/python manage.py runserver 0.0.0.0:8000
