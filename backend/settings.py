from datetime import timedelta

import environ

env = environ.Env()
# Load .env file for local development (safe if file is absent in production)
environ.Env.read_env()

STATIC_URL = env("STATIC_URL", default="/static/")
STATIC_ROOT = env("STATIC_ROOT", default="staticfiles")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Minimal Django settings for local development and management commands
SECRET_KEY = env("SECRET_KEY", default="debug-secret-key")
DEBUG = env.bool("DEBUG", default=True)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "core",
    "users",
    "marketplace",
]

USE_MINIO = env.bool("USE_MINIO", default=True)
if "storages" not in INSTALLED_APPS:
    INSTALLED_APPS.append("storages")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "corsheaders.middleware.CorsMiddleware",
]

ROOT_URLCONF = "urls"
WSGI_APPLICATION = "wsgi.application"

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
    }
]

DATABASES = {
    "default": env.db(),
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
}

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"]
)

AUTH_USER_MODEL = "users.User"

AWS_ACCESS_KEY_ID = env("MINIO_ROOT_USER")
AWS_SECRET_ACCESS_KEY = env("MINIO_ROOT_PASSWORD")
AWS_STORAGE_BUCKET_NAME = env("MINIO_BUCKET_NAME")
# Internal endpoint used by backend/container to talk to MinIO
AWS_S3_ENDPOINT_URL = env("MINIO_INTERNAL_ENDPOINT", default="http://minio:9000")
# Public endpoint used in generated media URLs (e.g. http://localhost:9000)
MINIO_PUBLIC_ENDPOINT = env("MINIO_PUBLIC_ENDPOINT", default="http://localhost:9000")
AWS_S3_REGION_NAME = env("MINIO_REGION", default="us-east-1")
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_S3_ADDRESSING_STYLE = "path"
AWS_DEFAULT_ACL = None
AWS_S3_FILE_OVERWRITE = True
AWS_QUERYSTRING_AUTH = False
STORAGES = {
    "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
    },
}
# Media URL uses the public endpoint so the browser can fetch files
MEDIA_URL = f"{MINIO_PUBLIC_ENDPOINT.rstrip('/')}/{AWS_STORAGE_BUCKET_NAME}/"
