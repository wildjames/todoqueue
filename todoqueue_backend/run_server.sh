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

# Start Nginx in the background
echo "Starting Nginx..."
nginx &

# Default to a host port of 8000, and if the environment variable is set then use that
if [ -z "$DJANGO_HOST_PORT" ]; then
   echo "Using default Django port of 8000"
   export DJANGO_HOST_PORT=8000
fi

# Start the Django server
echo "Starting the Django server..."
exec gunicorn todoqueue_backend.wsgi:application --bind 0.0.0.0:$DJANGO_HOST_PORT
