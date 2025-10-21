#!/bin/bash

# AWS Deployment Script
echo "☁️  Deploying Campaign Dashboard to AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "Visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "✅ AWS credentials verified"

# Build frontend
echo "📦 Building frontend..."
npm run build

# Deploy to S3 (if bucket exists)
read -p "Enter your S3 bucket name (or press Enter to skip): " S3_BUCKET

if [ ! -z "$S3_BUCKET" ]; then
    echo "📤 Uploading to S3..."
    aws s3 sync dist/ s3://$S3_BUCKET --delete
    
    # Invalidate CloudFront cache (if distribution ID provided)
    read -p "Enter CloudFront distribution ID (or press Enter to skip): " CF_DIST_ID
    
    if [ ! -z "$CF_DIST_ID" ]; then
        echo "🔄 Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
    fi
    
    echo "✅ Frontend deployed to S3!"
fi

echo ""
echo "📋 Next steps for backend deployment:"
echo "1. Build Docker image: docker build -t campaign-dashboard-backend ."
echo "2. Push to ECR: aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL"
echo "3. Tag image: docker tag campaign-dashboard-backend:latest YOUR_ECR_URL/campaign-dashboard-backend:latest"
echo "4. Push image: docker push YOUR_ECR_URL/campaign-dashboard-backend:latest"
echo "5. Deploy to ECS or App Runner via AWS Console"
echo ""
echo "🔗 AWS Console: https://console.aws.amazon.com"
