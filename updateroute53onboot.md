# Automatic Route53 DNS Update Guide
This guide will help you set up automatic DNS updates for your EC2 instance using AWS Lambda and CloudWatch Events.

## Prerequisites
- AWS Account with access to:
  - IAM
  - Lambda
  - CloudWatch
  - Route53
  - EC2
- Your EC2 instance ID
- Your Route53 Hosted Zone ID
- Your domain and subdomain information

## Step 1: Create IAM Role
1. Go to IAM Console:
   - Log into AWS Console
   - Search for "IAM"
   - Click on IAM service

2. Create Custom Policy:
   - Click "Policies" in left sidebar
   - Click "Create policy"
   - Choose "JSON" tab
   - Paste the following policy:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "ec2:DescribeInstances",
                   "route53:ChangeResourceRecordSets",
                   "logs:CreateLogGroup",
                   "logs:CreateLogStream",
                   "logs:PutLogEvents"
               ],
               "Resource": "*"
           }
       ]
   }
   ```
   - Click "Next"
   - Name it "Route53UpdaterPolicy"
   - Click "Create policy"

3. Create Role:
   - Click "Roles" in left sidebar
   - Click "Create role"
   - Select "AWS service" as trusted entity type
   - Select "Lambda" as use case
   - Click "Next"
   - Search and select both:
     - "AWSLambdaBasicExecutionRole"
     - "Route53UpdaterPolicy" (the one you just created)
   - Click "Next"
   - Name it "LambdaRoute53UpdaterRole"
   - Click "Create role"

## Step 2: Create Lambda Function
1. Go to Lambda Console:
   - Search for "Lambda"
   - Click on Lambda service

2. Create Function:
   - Click "Create function"
   - Choose "Author from scratch"
   - Function name: "UpdateRoute53Record"
   - Runtime: "Python 3.9"
   - Under Permissions, expand "Change default execution role"
   - Select "Use an existing role"
   - Choose "LambdaRoute53UpdaterRole"
   - Click "Create function"

3. Add Function Code:
   - In the code editor, replace all code with:
   ```python
   import boto3
    import json
    import logging

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    def lambda_handler(event, context):
        """
        Lambda function to update Route 53 DNS record when EC2 instance IP changes
        """
        # Configuration
        HOSTED_ZONE_ID = '<HOSTED_ZONE_ID>'
        DOMAIN_NAME = '<DOMAIN_NAME>'
        SUBDOMAIN = '<SUBDOMAIN>'
        FULL_DOMAIN = f"{SUBDOMAIN}.{DOMAIN_NAME}"
        
        try:
            # Log the incoming event for debugging
            logger.info(f"Received event: {json.dumps(event)}")
            
            # Get instance ID from the CloudWatch event - Note the change here
            instance_id = event['detail']['instance-id']  # Changed from 'instanceId' to 'instance-id'
            logger.info(f"Processing instance ID: {instance_id}")
            
            # Initialize AWS clients
            ec2 = boto3.client('ec2')
            route53 = boto3.client('route53')
            
            # Get instance's public IP
            response = ec2.describe_instances(InstanceIds=[instance_id])
            instance = response['Reservations'][0]['Instances'][0]
            public_ip = instance.get('PublicIpAddress')
            
            if not public_ip:
                logger.error(f"No public IP found for instance {instance_id}")
                return {
                    'statusCode': 400,
                    'body': 'No public IP found for instance'
                }
            
            logger.info(f"Found public IP: {public_ip}")
            
            # Update Route 53 record
            change_batch = {
                'Changes': [
                    {
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': FULL_DOMAIN,
                            'Type': 'A',
                            'TTL': 60,
                            'ResourceRecords': [
                                {
                                    'Value': public_ip
                                }
                            ]
                        }
                    }
                ]
            }
            
            logger.info(f"Updating Route53 with change batch: {json.dumps(change_batch)}")
            
            response = route53.change_resource_record_sets(
                HostedZoneId=HOSTED_ZONE_ID,
                ChangeBatch=change_batch
            )
            
            logger.info(f"Successfully updated DNS record for {FULL_DOMAIN} to {public_ip}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'domain': FULL_DOMAIN,
                    'ip': public_ip,
                    'message': 'DNS record updated successfully'
                })
            }
            
        except KeyError as e:
            logger.error(f"Error accessing event data: {str(e)}")
            logger.error(f"Event structure: {json.dumps(event, default=str)}")
            return {
                'statusCode': 400,
                'body': f"Invalid event structure: missing {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error updating Route 53: {str(e)}")
            logger.error(f"Full error details: {json.dumps(event, default=str)}")
            return {
                'statusCode': 500,
                'body': str(e)
            }
   ```
   - Click "Deploy"

## Step 3: Create CloudWatch Event Rule
1. Go to CloudWatch Console:
   - Search for "CloudWatch"
   - Click on CloudWatch service

2. Create Rule:
   - In left sidebar, expand "Events"
   - Click "Rules" under "EventBridge"
   - Click "Create rule"
   - Name: "EC2-Route53-Update"
   - Description (optional): "Trigger Lambda when EC2 instance starts"

3. Configure Event Pattern:
   - Select "AWS services"
   - Select "EC2"
   - For Event type, select "EC2 Instance State-change Notification"
   - For Specific state(s), select "running"
   - Under "Specific instance IDs", add your EC2 instance ID

4. Add Target:
   - Under "Target 1", select "Lambda function"
   - Select your "UpdateRoute53Record" function
   - Keep "Configure input" as "Matched event"
   - Click "Next"
   - Click "Next" on Tags page
   - Click "Create rule"

## Step 4: Testing
1. Test the Setup:
   - Reboot your EC2 instance
   - Wait a few minutes for it to start up

2. Verify Updates:
   - Check CloudWatch Logs:
     - Go to CloudWatch console
     - Click "Log groups" in left sidebar
     - Find "/aws/lambda/UpdateRoute53Record"
     - Check latest log stream
   - Verify DNS record:
     - Use `dig` or `nslookup` to check your domain
     - `dig app.yisraelberman.com`

3. Troubleshooting:
   - If DNS doesn't update:
     - Check Lambda function logs for errors
     - Verify IAM permissions
     - Ensure CloudWatch rule is targeting correct instance
     - Confirm Route53 Zone ID and domain information are correct

## Additional Notes
- The TTL is set to 60 seconds for quick updates
- The function uses UPSERT which will create or update the record
- CloudWatch logs will show the results of each update attempt
- The Lambda function will only run when the instance enters the "running" state

## Security Considerations
- The IAM role uses broad permissions for simplicity
- For production, consider restricting permissions to specific resources
- Consider adding encryption for sensitive data
- Monitor CloudWatch logs for unauthorized access attempts

Need help or encounter issues? Check CloudWatch logs first, then AWS support documentation.