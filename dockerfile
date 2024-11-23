# Stage 1: Build the React frontend
FROM node:21 as frontend-builder
WORKDIR /app
COPY todoqueue_frontend/package.json todoqueue_frontend/package-lock.json ./
RUN npm install
COPY todoqueue_frontend ./
RUN npm run build


# Stage 2: Build the Django backend
FROM python:3.12-slim as backend-builder
WORKDIR /app
COPY todoqueue_backend/requirements.txt ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev python3-dev default-libmysqlclient-dev pkg-config \
    && pip install --upgrade pip \
    && pip install --upgrade setuptools \
    && pip install -r requirements.txt
COPY todoqueue_backend todoqueue_backend
RUN ls -alh


# Stage 3: Setup Nginx and final image
FROM python:3.12-slim
# Install Nginx
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx default-libmysqlclient-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the built React static files from the frontend-builder stage
COPY --from=frontend-builder /app/build /var/www/html

# Copy the installed dependencies from the backend-builder stage
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy the Django application from the backend-builder stage
WORKDIR /app
COPY --from=backend-builder /app/todoqueue_backend /app/

# Add Nginx configuration file
COPY ./nginx.conf /etc/nginx/nginx.conf

# Start Nginx and the Django application using the entrypoint script
CMD ["./run_server.sh"]
