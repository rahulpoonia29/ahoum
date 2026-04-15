import json
import logging

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


def ensure_bucket_exists():
    """Ensure the MinIO bucket exists and is publicly readable.
    
    Safe to call repeatedly. Errors are logged but do not raise
    to avoid breaking startup if MinIO is temporarily unavailable.
    """
    try:
        endpoint = getattr(settings, "AWS_S3_ENDPOINT_URL", None)
        aws_access_key_id = getattr(settings, "AWS_ACCESS_KEY_ID", None)
        aws_secret_access_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", None)
        bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)

        if not (endpoint and aws_access_key_id and aws_secret_access_key and bucket):
            logger.warning("MinIO settings incomplete; skipping bucket ensure")
            return

        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
        )

        try:
            client.head_bucket(Bucket=bucket)
        except ClientError:
            client.create_bucket(Bucket=bucket)
            logger.info("Created MinIO bucket: %s", bucket)

        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                }
            ],
        }
        
        client.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))
        logger.info("Set public read policy for bucket: %s", bucket)

    except ClientError as e:
        logger.error("MinIO client error: %s", e)
    except Exception as e:
        logger.error("Unexpected error ensuring MinIO bucket: %s", e)
