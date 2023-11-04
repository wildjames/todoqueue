#!/bin/sh

# Check if Django's manage.py is present in the current directory
if [ ! -f "./manage.py" ]; then
    echo "Error: manage.py not found in the current directory. Are you in the Django project root?"
    exit 1
fi

# Run database migrations
echo "Running database migrations..." && \
python manage.py migrate && \

# Create a superuser from environment variables
python manage.py createsuperuser --noinput || true

# Collect static files
echo "Collecting static files..." && \
python manage.py collectstatic --noinput && \

# Start the Django server
echo "Starting the Django server..."

exec gunicorn todoqueue_backend.wsgi:application --bind 0.0.0.0:$DJANGO_HOST_PORT
