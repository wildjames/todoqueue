.PHONY: install dev build clean

install:
	# Install backend dependencies
	pip install --upgrade pip
	pip install -r todoqueue_backend/requirements.txt
	# Install frontend dependencies
	cd todoqueue_frontend && npm install

dev:
	./run_dev.sh

build:
	# Build the React frontend
	cd todoqueue_frontend && npm run build
	# Collect static files for Django
	cd todoqueue_backend && python manage.py collectstatic --noinput
	# Build the Docker image
	docker build -t todoqueue:latest .

clean:
	# Clean up build artifacts and cache files
	rm -rf todoqueue_frontend/node_modules
	rm -rf todoqueue_frontend/build
	rm -rf todoqueue_backend/staticfiles
	find . -name '*.pyc' -delete
	find . -name '__pycache__' -delete
