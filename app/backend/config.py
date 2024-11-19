import boto3
from dotenv import load_dotenv
import os


# Initialize DynamoDB connection with environment variables
def create_dynamodb_resource():
    return boto3.resource('dynamodb',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION')
    )

# Get table names based on environment
def get_table_name(base_name):
    environment = os.getenv('ENVIRONMENT', 'dev')
    return f"{environment}-{base_name}"

# Create table connections once at startup
dynamodb = create_dynamodb_resource()
volunteers_table = dynamodb.Table(get_table_name('volunteers'))
fence_points_table = dynamodb.Table(get_table_name('fence-points'))