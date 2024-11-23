#!/bin/bash

trap "kill 0" EXIT

# Start the Django backend
(cd todoqueue_backend && python manage.py runserver 0.0.0.0:8000) &

# Start the React frontend
(cd todoqueue_frontend && npm start) &

wait
