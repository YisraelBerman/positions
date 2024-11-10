# Git setup
## pre-commit setup
'''
pip install flake8
npm install -g eslint
'''





#AWS setup
# Detailed Guide: Setting up Route 53 for React App 

## Prerequisites
- An AWS account
- A registered domain name
- EC2 instances running your React app server

## Step 1: Create a Hosted Zone in Route 53

1. Log into the AWS Management Console
2. Navigate to the Route 53 service
3. In the left sidebar, click on "Hosted zones"
4. Click the "Create hosted zone" button
5. Enter your domain name (e.g., yourdomain.com) in the "Domain name" field
6. Leave "Type" as "Public hosted zone"
7. Click "Create hosted zone"

## Step 2: Update Your Domain's Name Servers

1. In your new hosted zone, find the NS (Name Server) record
2. Copy the four name server addresses listed
3. Go to your domain registrar's website (where you purchased your domain)
4. Find the option to change name servers (often under "Domain settings" or "DNS settings")
5. Replace the existing name servers with the four you copied from Route 53
6. Save the changes

Note: It may take up to 48 hours for these changes to propagate globally

## Step 3: Create A Records for Your React App

1. In the Route 53 console, select your hosted zone
2. Click "Create record"
3. For the React app:
   - Name: Enter your desired subdomain (e.g., "app")
   - Record type: Choose "A - Routes traffic to an IPv4 address and some AWS resources"
   - Value: Enter your EC2 instance's current public IP address
   - TTL (seconds): Enter 60 (or lower for quicker updates)
   - Click "Create records"


## Step 4: Set Up IAM Role for Route 53 Updates

1. Go to the IAM console
2. Click "Roles" in the left sidebar, then "Create role"
3. Choose "AWS service" and select "EC2" as the use case
4. Click "Next: Permissions"
5. Search for and select "AmazonRoute53FullAccess" (Note: In a production environment, you should create a more restrictive custom policy)
6. Click "Next: Tags" (add tags if desired), then "Next: Review"
7. Name the role (e.g., "EC2Route53UpdateRole") and click "Create role"

## Step 5: Attach IAM Role to EC2 Instances

1. Go to the EC2 console
2. Select your React app instance
3. Click "Actions" > "Security" > "Modify IAM role"
4. Select the role you created in Step 4
5. Click "Save"


## Step 6: Create a Script to Update DNS

1. SSH into your EC2 instance
2. Install AWS CLI
3. Create a new file (e.g., `update_route53.sh`) with the following content:

```bash
#!/bin/bash
HOSTED_ZONE_ID="your-hosted-zone-id"
DOMAIN_NAME="yourdomain.com"
SUBDOMAIN="app" 

# Get the instance's public IP
IP=$(curl -s http://checkip.amazonaws.com)

# Update Route 53 record
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '{
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "'$SUBDOMAIN.$DOMAIN_NAME'",
            "Type": "A",
            "TTL": 60,
            "ResourceRecords": [{"Value": "'$IP'"}]
        }
    }]
}'
```

3. Replace `your-hosted-zone-id` with your actual Hosted Zone ID (found in the Route 53 console)
4. Make the script executable: `chmod +x update_route53.sh`
5. install aws cli on machine.

## Step 7: Configure Instances to Run Script on Startup

1. Edit the `/etc/rc.local` file (create it if it doesn't exist):
   ```
   sudo nano /etc/rc.local
   ```
2. Add the following lines before the `exit 0` line:
   ```
   #!/bin/bash
   /path/to/your/update_route53.sh
   ```
3. Make sure `/etc/rc.local` is executable:
   ```
   sudo chmod +x /etc/rc.local
   ```

## Step 8: Set Up HTTPS
1. Create certs
```
sudo apt-get update
sudo apt-get install certbot
sudo certbot certonly --standalone -d <auth.yourdomain.com>
sudo cat /etc/letsencrypt/live/<auth.yourdomain.com>/fullchain.pem \
    /etc/letsencrypt/live/<auth.yourdomain.com>/privkey.pem > </path/to/app-cert>.pem
sudo chown root:docker </path/to/app-cert>.pem
sudo chmod 640 </path/to/app-cert>.pem
```
2. Add the certs
for example, add to Dockerfile:
```
   volumes:
      - /etc/letsencrypt/live/<auth.yourdomain.com>/fullchain.pem:/etc/x509/https/tls.crt:ro
      - /etc/letsencrypt/live/<auth.yourdomain.com>/privkey.pem:/etc/x509/https/tls.key:ro
```
Now configure your React app to use these certificates. The exact process will depend on your server setup.
3. Configure automatic renewal
```
certbot renew
```

## Step 9: Test Your Setup

1. Restart your EC2 instances
2. Check that the Route 53 A records have been updated with the new IP addresses
3. Try accessing your React app via its subdomain (e.g., https://app.yourdomain.com)

Remember to replace placeholders like `your-hosted-zone-id`, `yourdomain.com`, etc., with your actual values throughout this guide.



# Tag - increae major tag:
For example, if you want to go from v1.2.3.4 to v2.0.0.0:
'''
   # Check current tags
   git tag -l

   # Create new tag
   git tag -a v2.0.0.0 -m "Release v2.0.0.0
   backend: 2.0.0
   frontend: 2.0.0"

   # Verify the tag and its message
   git show v2.0.0.0

   # Push the tag
   git push origin v2.0.0.0
'''