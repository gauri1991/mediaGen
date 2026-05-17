#!/usr/bin/env bash
# Start Celery worker
set -e
cd "$(dirname "$0")/../backend"
DJANGO_SETTINGS_MODULE=config.settings .venv/bin/celery -A config worker --loglevel=info --concurrency=2
