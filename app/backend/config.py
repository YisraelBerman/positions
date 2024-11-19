import boto3
from dotenv import load_dotenv
import os

print("Starting config initialization...")

load_dotenv()

def create_dynamodb_resource():
    print("Environment variables:")
    for key in ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'ENVIRONMENT']:
        value = os.environ.get(key)
        print(f"{key}: {'Present' if value else 'Missing'} ({'*' * min(len(value), 4) if value else 'None'})")

    return boto3.resource('dynamodb',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION', 'us-east-1')
    )

def get_table_name(base_name):
    environment = os.environ.get('ENVIRONMENT', 'dev')
    return f"{environment}-{base_name}"

try:
    dynamodb = create_dynamodb_resource()
    volunteers_table = dynamodb.Table(get_table_name('volunteers'))
    fence_points_table = dynamodb.Table(get_table_name('fence-points'))
except Exception as e:
    print(f"DynamoDB connection error: {str(e)}")
    raise