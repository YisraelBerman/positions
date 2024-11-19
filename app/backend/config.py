import boto3
import os
from urllib.parse import unquote

def create_dynamodb_resource():
    secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    secret_key = unquote(secret_key)  # Handle forward slashes

    return boto3.resource('dynamodb',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=secret_key,
        region_name=os.environ.get('AWS_REGION', 'us-east-1')
    )

def get_table_name(base_name):
    environment = os.environ.get('ENVIRONMENT', 'dev')
    return f"{environment}-{base_name}"

dynamodb = create_dynamodb_resource()
volunteers_table = dynamodb.Table(get_table_name('volunteers'))
fence_points_table = dynamodb.Table(get_table_name('fence-points'))