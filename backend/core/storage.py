from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import Storage


class DisabledLocalStorage(Storage):
    def _open(self, name, mode="rb"):
        raise NotImplementedError("Local storage disabled; use S3/MinIO storage")

    def _save(self, name, content):
        raise NotImplementedError("Local storage disabled; use S3/MinIO storage")

    def exists(self, name):
        return False

    def url(self, name):
        return f"{settings.MEDIA_URL.rstrip('/')}/{name}"
