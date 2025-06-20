"""
Django settings for todoqueue_backend project.

Generated by 'django-admin startproject' using Django 4.2.5.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from datetime import timedelta
from pathlib import Path
from os import path, urandom, environ
from django.core.exceptions import ImproperlyConfigured
from logging import getLogger, INFO, DEBUG, basicConfig
from dotenv import load_dotenv


def get_env_variable(var_name, default=None, cast_type=str):
    """Get the environment variable or return exception"""
    try:
        value = environ[var_name]
        if cast_type is not None:
            if cast_type == bool:
                value = value.lower() in ["true", "1", "t"]
            else:
                value = cast_type(value)
    except KeyError:
        if default is not None:
            value = default
        else:
            error_msg = f"Set the {var_name} environment variable"
            raise ImproperlyConfigured(error_msg)
    return value


# Load environment variables from .env file
if get_env_variable("DEV", False, bool):
    dotenv_path = path.join(path.dirname(__file__), "..", ".env")
    print(f"Checking for env: {dotenv_path}")
    if path.exists(dotenv_path):
        print("Loading env")
        load_dotenv(dotenv_path)
else:
    load_dotenv()

# Fetch all the environment variables
env_debug = get_env_variable("DJANGO_DEBUG", False, bool)
logging_level = get_env_variable("DJANGO_LOGGING_LEVEL", "info", str).lower()
web_port = get_env_variable("DJANGO_HOST_PORT", 8000, int)
frontend_url = get_env_variable("FRONTEND_URL", "")

cache_engine = get_env_variable("DJANGO_CACHE_BACKEND", "")
redis_cache_location = get_env_variable(
    "DJANGO_CACHE_LOCATION", "redis://127.0.0.1:6379/1"
)

db_name = get_env_variable("DJANGO_DB_NAME")
db_user = get_env_variable("DJANGO_DB_USER")
db_pass = get_env_variable("DJANGO_DB_PASSWORD")
db_host = get_env_variable("DJANGO_DB_HOST")
db_port = get_env_variable("DJANGO_DB_PORT", 3306, int)

# Email credentials
EMAIL_HOST = get_env_variable("EMAIL_HOST", "")
EMAIL_PORT = get_env_variable("EMAIL_PORT", 587, int)
EMAIL_USE_TLS = get_env_variable("EMAIL_USE_TLS", True, bool)
EMAIL_HOST_USER = get_env_variable("EMAIL_HOST_USER", "")
DEFAULT_FROM_EMAIL = get_env_variable("DEFAULT_FROM_EMAIL", "")
EMAIL_HOST_PASSWORD = get_env_variable("EMAIL_HOST_PASSWORD", "")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_env_variable(
    "DJANGO_SECRET", cast_type=None, default=urandom(32))


# Logging verbosity
if logging_level.lower() == "debug":
    basicConfig(level=DEBUG)
else:
    basicConfig(level=INFO)

logger = getLogger(__name__)
logger.info(f"Logging level: {logging_level}")
logger.info(f"Django is using DEBUG = {env_debug}")

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/


# SECURITY WARNING: don't run with debug turned on in production!
env_debug = env_debug in [True, 1, "1", "true", "yes"]

DEBUG = env_debug

logger.info("Whilelisting host for CSRF: {}".format(frontend_url))

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
ALLOWED_HOSTS = ["*"]
ALLOWED_CSRF_ORIGINS = [f"localhost:{web_port}", "localhost:3000"]
if frontend_url:
    ALLOWED_CSRF_ORIGINS.append(frontend_url)
logger.info(f"Allowed CSRF origins: {ALLOWED_CSRF_ORIGINS}")

CORS_ALLOW_CREDENTIALS = True
CORS_ORIGIN_ALLOW_ALL = True

# Static files configurations
# Static files configurations
STATIC_URL = "/static/"
STATIC_ROOT = path.join(BASE_DIR, "static")


EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "accounts",
    "tasks",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "todoqueue_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "todoqueue_backend.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": db_name,
        "USER": db_user,
        "PASSWORD": db_pass,
        "HOST": db_host,
        "PORT": db_port,
    }
}

if cache_engine == "redis":
    logger.info("Using RedisCache")
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": redis_cache_location,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            },
        }
    }
else:
    logger.info("Using LocMemCache")
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }

AUTH_USER_MODEL = "accounts.CustomUser"

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
}

SIMPLE_JWT = {
# Keep the 30-day access token so clients regularly refresh and rotate tokens
# each month, but extend the refresh token lifetime so a user can remain
# logged in for up to a year without re-authenticating.
    "ACCESS_TOKEN_LIFETIME": timedelta(days=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=365),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = "en-gb"

TIME_ZONE = "Europe/London"

USE_I18N = True

USE_TZ = True


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
