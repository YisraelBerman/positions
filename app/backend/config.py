import boto3
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize DynamoDB connection with environment variables
def create_dynamodb_resource():
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_region = os.getenv('AWS_REGION')
    
    if not all([aws_access_key, aws_secret_key, aws_region]):
        raise ValueError("AWS credentials not found in environment variables")
        
    return boto3.resource('dynamodb',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )

# Get table names based on environment
def get_table_name(base_name):
    environment = os.getenv('ENVIRONMENT', 'dev')
    return f"{environment}-{base_name}"

# Create table connections
dynamodb = create_dynamodb_resource()
volunteers_table = dynamodb.Table(get_table_name('volunteers'))
fence_points_table = dynamodb.Table(get_table_name('fence-points'))