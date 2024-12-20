.PHONY: install dev build clean lint

install:
	# Install backend dependencies
	pip install --upgrade pip
	pip install -r todoqueue_backend/requirements.txt
	# Install frontend dependencies
	cd todoqueue_frontend && npm install

dev-frontend:
	cd todoqueue_frontend && npm start

dev-backend:
	cd todoqueue_backend && python3 manage.py runserver

build:
	# Build the React frontend
	cd todoqueue_frontend && npm run build
	# Collect static files for Django
	cd todoqueue_backend && python3 manage.py collectstatic --noinput
	# Build the Docker image
	docker build -t todoqueue:latest .

clean:
	# Clean up build artifacts and cache files
	rm -rf todoqueue_frontend/node_modules
	rm -rf todoqueue_frontend/build
	rm -rf todoqueue_backend/staticfiles
	find . -name '*.pyc' -delete
	find . -name '__pycache__' -delete

lint:
	# Lint Python code with Black
	black todoqueue_backend
	# Lint JavaScript code with ESLint
	cd todoqueue_frontend && npx eslint .
