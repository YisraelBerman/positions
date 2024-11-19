import boto3
import os

def create_dynamodb_resource():
    print("Creating DynamoDB resource with credentials from environment")
    return boto3.resource('dynamodb',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        region_name=os.environ['AWS_REGION']
    )

def get_table_name(base_name):
    environment = os.environ.get('ENVIRONMENT', 'dev')
    return f"{environment}-{base_name}"

dynamodb = create_dynamodb_resource()
volunteers_table = dynamodb.Table(get_table_name('volunteers'))
fence_points_table = dynamodb.Table(get_table_name('fence-points'))