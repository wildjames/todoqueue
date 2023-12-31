export EMAIL_HOST=smtp-mail.outlook.com
export EMAIL_PORT=587
export EMAIL_USE_TLS=1
export EMAIL_HOST_USER=
export DEFAULT_FROM_EMAIL=
export EMAIL_HOST_PASSWORD=

export DJANGO_DEBUG=0
export DJANGO_HOST_PORT=8000

export DJANGO_DB_NAME=todoqueue
export DJANGO_DB_USER=root
export DJANGO_DB_PASSWORD=password
export DJANGO_DB_HOST=localhost
export DJANGO_DB_PORT=3306

export DJANGO_CACHE_BACKEND="redis"
export DJANGO_CACHE_LOCATION="redis://127.0.0.1:6379/1"

export DJANGO_SUPERUSER_EMAIL=
export DJANGO_SUPERUSER_USERNAME=
export DJANGO_SUPERUSER_PASSWORD=

# MySQL client. Not necessary in Docker. Only necessary for my specific local dev environment.
export DYLD_LIBRARY_PATH="/usr/local/mysql-8.0.30-macos12-arm64/lib/:$DYLD_LIBRARY_PATH"


cd todoqueue_frontend && \
npm run build && \

cd ../todoqueue_backend && \
source ./run_server.sh
