import boto3
import os

def create_dynamodb_resource():
    # Use default credentials method
    session = boto3.Session(
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=os.environ.get('AWS_REGION')
    )
    
    # Print debug info without exposing secrets
    print("AWS Config:")
    print(f"Region: {session.region_name}")
    print(f"Access Key ID: {session.get_credentials().access_key[:4]}...")
    
    return session.resource('dynamodb')

def get_table_name(base_name):
    environment = os.environ.get('ENVIRONMENT', 'dev')
    table_name = f"{environment}-{base_name}"
    print(f"Using table: {table_name}")
    return table_name

try:
    dynamodb = create_dynamodb_resource()
    volunteers_table = dynamodb.Table(get_table_name('volunteers'))
    fence_points_table = dynamodb.Table(get_table_name('fence-points'))
except Exception as e:
    print(f"DynamoDB initialization error: {str(e)}")
    raise