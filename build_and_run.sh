docker build -t todoqueue . && \
docker run --env-file .env -p 8000:8000 todoqueue