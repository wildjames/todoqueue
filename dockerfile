# Use an official Python runtime as base image
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        python3-dev \
        default-libmysqlclient-dev \
        pkg-config \
        npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ./todoqueue_backend/requirements.txt /app/
WORKDIR /app
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy Django application
COPY todoqueue_backend /app/todoqueue_backend

# Copy frontend application, and build it
COPY todoqueue_frontend /app/todoqueue_frontend
WORKDIR /app/todoqueue_frontend
RUN npm install
RUN npm run build

WORKDIR /app/todoqueue_backend

CMD ["./run_server.sh"]
