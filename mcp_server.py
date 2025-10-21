# mcp_server.py 
import base64
import json
import time
import boto3
import uuid
import datetime
from mcp.server.fastmcp import FastMCP

# Check boto3 version (removed prints to avoid JSON-RPC interference)
# boto3 version check: requires >= 1.35.0 for Nova Reel async API

mcp = FastMCP(host="0.0.0.0", stateless_http=True)

# Initialize both Bedrock clients
bedrock_runtime = boto3.client("bedrock-runtime", region_name="us-east-1") #preferred 
s3_client = boto3.client("s3", region_name="us-east-1")

# IMPORTANT: Configure your S3 bucket for outputs
S3_BUCKET = "agentcore-demo-172"  
S3_OUTPUT_PREFIX = "video-outputs"
S3_IMAGE_PREFIX = "image-outputs"

def download_video_from_s3(s3_uri: str) -> str:
    """Download video from S3 to local directory"""
    try:
        # Parse S3 URI (s3://bucket/key)
        s3_parts = s3_uri.replace("s3://", "").split("/", 1)
        bucket = s3_parts[0]
        key = s3_parts[1]
        
        # Create S3 client
        s3_client = boto3.client("s3", region_name="us-east-1")
        
        # Create local filename with timestamp
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        local_filename = f"nova_reel_{timestamp}.mp4"
        
        # Download the file (removed print to avoid JSON-RPC interference)
        s3_client.download_file(bucket, key, local_filename)
        
        return local_filename
        
    except Exception as e:
        raise Exception(f"Failed to download video: {str(e)}")  

@mcp.tool()
def generate_video(
    prompt: str, 
    duration: int = 6, 
    width: int = 1280, 
    height: int = 720, 
    fps: int = 24, 
    seed: int = 42,
    max_wait_seconds: int = 300,
    update_interval: int = 10  # ADD THIS parameter
) -> str:
    """
    Generate a video using Amazon Nova Reel (async job-based API).
    Returns the S3 location of the generated video with progress updates.
    
    Args:
        prompt: Text description of the video to generate
        duration: Video duration in seconds (1-6)
        width: Video width (1280 or 1920)
        height: Video height (720 or 1080)
        fps: Frames per second (24 or 30)
        seed: Random seed for reproducibility
        max_wait_seconds: Maximum time to wait for job completion
        update_interval: Seconds between status update messages (default: 10)
    """
    try:
        # Construct request according to Nova Reel spec
        request_body = {
            "taskType": "TEXT_VIDEO",
            "textToVideoParams": {
                "text": prompt
            },
            "videoGenerationConfig": {
                "durationSeconds": duration,
                "fps": fps,
                "dimension": f"{width}x{height}",
                "seed": seed
            }
        }
        
        # Start async job using bedrock-runtime client
        response = bedrock_runtime.start_async_invoke(
            modelId="amazon.nova-reel-v1:0",
            modelInput=request_body,
            outputDataConfig={
                "s3OutputDataConfig": {
                    "s3Uri": f"s3://{S3_BUCKET}/{S3_OUTPUT_PREFIX}/"
                }
            }
        )
        
        invocation_arn = response["invocationArn"]
        start_time = time.time()
        last_update_time = start_time  # ADD THIS: Track last update time
        
        # Poll for completion with progress updates
        while (time.time() - start_time) < max_wait_seconds:
            status_response = bedrock_runtime.get_async_invoke(invocationArn=invocation_arn)
            status = status_response["status"]
            elapsed = int(time.time() - start_time)
            
            # ADD THIS: Show progress update every update_interval seconds
            if (time.time() - last_update_time) >= update_interval:
                if status in ["InProgress", "Submitted"]:
                    print(f"⏳ Video generation in progress... ({elapsed}s elapsed, status: {status})")
                last_update_time = time.time()
            
            if status == "Completed":
                output_location = status_response["outputDataConfig"]["s3OutputDataConfig"]["s3Uri"]
                
                # Try to download the video to local directory
                local_file_path = None
                try:
                    local_file_path = download_video_from_s3(output_location)
                    print(f"✅ Video generated successfully in {elapsed}s")  # ADD THIS
                except Exception as e:
                    # Silently handle download errors to avoid JSON-RPC interference
                    pass
                
                return json.dumps({
                    "success": True,
                    "message": f"Video generated successfully in {elapsed}s",
                    "s3_location": output_location,
                    "local_file_path": local_file_path,
                    "invocation_arn": invocation_arn,
                    "generation_time_seconds": elapsed  # ADD THIS
                })
            elif status == "Failed":
                failure_msg = status_response.get("failureMessage", "Unknown error")
                print(f"❌ Video generation failed after {elapsed}s")  # ADD THIS
                return json.dumps({
                    "success": False,
                    "error": f"Video generation failed: {failure_msg}"
                })
            
            time.sleep(5)  # Check every 5 seconds (keeps polling frequent)
        
        print(f"⚠️ Video generation timeout after {max_wait_seconds}s")  # ADD THIS
        return json.dumps({
            "success": False,
            "error": f"Timeout after {max_wait_seconds} seconds. Job may still be running.",
            "invocation_arn": invocation_arn
        })
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

@mcp.tool()
def check_video_job_status(invocation_arn: str) -> str:
    """
    Check the status of a Nova Reel video generation job.
    
    Args:
        invocation_arn: The ARN returned when starting the video job
    """
    try:
        response = bedrock_runtime.get_async_invoke(invocationArn=invocation_arn)
        status = response["status"]
        
        result = {
            "status": status,
            "invocation_arn": invocation_arn,
            "output_location": response.get("outputDataConfig", {}).get("s3OutputDataConfig", {}).get("s3Uri"),
            "failure_message": response.get("failureMessage")
        }
        
        # If completed, try to download
        if status == "Completed" and result["output_location"]:
            try:
                local_file = download_video_from_s3(result["output_location"])
                result["local_file_path"] = local_file
            except Exception as e:
                result["download_error"] = str(e)
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

@mcp.tool()
def generate_image(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    style: str = "photographic",
    seed: int = None
) -> str:
    """
    Generate an image using Stability AI Stable Diffusion via Amazon Bedrock.
    Saves the image to S3 bucket and returns the S3 URL.
    
    Args:
        prompt: Text description of the image to generate
        width: Image width (512, 768, 1024, 1152, 1216, 1344, 1536)
        height: Image height (512, 768, 1024, 1152, 1216, 1344, 1536)
        style: Style preset (photographic, digital-art, cinematic, anime, fantasy-art, etc.)
        seed: Random seed for reproducibility (optional)
    """
    try:
        # Generate unique filename
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"generated_image_{timestamp}_{unique_id}.png"
        s3_key = f"{S3_IMAGE_PREFIX}/{filename}"
        
        # Prepare request body for Stability AI
        request_body = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1.0
                }
            ],
            "cfg_scale": 7,
            "width": width,
            "height": height,
            "samples": 1,
            "steps": 30,
            "style_preset": style
        }
        
        # Add seed if provided
        if seed is not None:
            request_body["seed"] = seed
        
        # Call Stability AI via Bedrock
        response = bedrock_runtime.invoke_model(
            modelId="stability.stable-diffusion-xl-v1",
            body=json.dumps(request_body),
            contentType="application/json",
            accept="application/json"
        )
        
        # Parse response
        response_body = json.loads(response["body"].read())
        
        if "artifacts" not in response_body or len(response_body["artifacts"]) == 0:
            return json.dumps({
                "success": False,
                "error": "No image generated in response"
            })
        
        # Get the base64 encoded image
        image_data = response_body["artifacts"][0]["base64"]
        
        # Decode and upload to S3
        image_bytes = base64.b64decode(image_data)
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=image_bytes,
            ContentType="image/png",
            Metadata={
                "prompt": prompt[:1000],  # Truncate if too long
                "style": style,
                "dimensions": f"{width}x{height}",
                "generated_at": timestamp
            }
        )
        
        # Generate S3 URL
        s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        
        return json.dumps({
            "success": True,
            "message": "Image generated successfully",
            "s3_url": s3_url,
            "s3_key": s3_key,
            "filename": filename,
            "prompt": prompt,
            "dimensions": f"{width}x{height}",
            "style": style
        })
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Image generation failed: {str(e)}"
        })

@mcp.tool()
def generate_image_nova(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    quality: str = "standard",
    seed: int = None
) -> str:
    """
    Generate an image using Amazon Nova Canvas via Bedrock.
    Saves the image to S3 bucket and returns the S3 URL.
    
    Args:
        prompt: Text description of the image to generate
        width: Image width (1024, 1280, 1536, 1792, 2048)
        height: Image height (1024, 1280, 1536, 1792, 2048)
        quality: Image quality (standard, premium)
        seed: Random seed for reproducibility (optional)
    """
    try:
        # Generate unique filename
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"nova_image_{timestamp}_{unique_id}.png"
        s3_key = f"{S3_IMAGE_PREFIX}/nova/{filename}"
        
        # Prepare request body for Nova Canvas
        request_body = {
            "taskType": "TEXT_IMAGE",
            "textToImageParams": {
                "text": prompt
            },
            "imageGenerationConfig": {
                "numberOfImages": 1,
                "quality": quality,
                "width": width,
                "height": height
            }
        }
        
        # Add seed if provided
        if seed is not None:
            request_body["imageGenerationConfig"]["seed"] = seed
        
        # Call Nova Canvas via Bedrock
        response = bedrock_runtime.invoke_model(
            modelId="amazon.nova-canvas-v1:0",
            body=json.dumps(request_body),
            contentType="application/json",
            accept="application/json"
        )
        
        # Parse response
        response_body = json.loads(response["body"].read())
        
        if "images" not in response_body or len(response_body["images"]) == 0:
            return json.dumps({
                "success": False,
                "error": "No image generated in response"
            })
        
        # Get the base64 encoded image
        image_data = response_body["images"][0]
        
        # Decode and upload to S3
        image_bytes = base64.b64decode(image_data)
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=image_bytes,
            ContentType="image/png",
            Metadata={
                "prompt": prompt[:1000],  # Truncate if too long
                "quality": quality,
                "dimensions": f"{width}x{height}",
                "generated_at": timestamp,
                "model": "nova-canvas"
            }
        )
        
        # Generate S3 URL
        s3_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
        
        return json.dumps({
            "success": True,
            "message": "Image generated successfully with Nova Canvas",
            "s3_url": s3_url,
            "s3_key": s3_key,
            "filename": filename,
            "prompt": prompt,
            "dimensions": f"{width}x{height}",
            "quality": quality,
            "model": "nova-canvas"
        })
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Nova Canvas image generation failed: {str(e)}"
        })

if __name__ == "__main__":
    # Removed prints to avoid JSON-RPC interference when used as stdio server
    mcp.run(transport="streamable-http")