#!/usr/bin/env python3
"""
Simple Dashboard Server - Serves the marketing campaign dashboard with demo functionality
"""

import os
import json
import time
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import asyncio
from datetime import datetime
import subprocess


import time
from collections import defaultdict

# Rate limiting for analytics requests
analytics_request_times = defaultdict(list)
ANALYTICS_RATE_LIMIT = 2  # seconds between requests per session

app = FastAPI(title="Marketing Campaign Dashboard", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track processed feedback to prevent loops
processed_feedback = set()

# Create directories and mount static files
downloads_dir = "downloads"
public_dir = "public"
os.makedirs(downloads_dir, exist_ok=True)
os.makedirs(public_dir, exist_ok=True)
os.makedirs(os.path.join(public_dir, "media"), exist_ok=True)

app.mount("/downloads", StaticFiles(directory=downloads_dir), name="downloads")
app.mount("/public", StaticFiles(directory=public_dir), name="public")

# Pydantic models
class CampaignStartRequest(BaseModel):
    product: str
    product_cost: float
    budget: float

class FeedbackRequest(BaseModel):
    session_id: str
    feedback_type: str
    feedback: Optional[str] = None

# In-memory session storage
sessions = {}

# Real-time agent output storage
agent_outputs = {}

# Import our marketing campaign functions
try:
    from market_campaign import (
        AudienceAgent, BudgetAgent, PromptAgent,
        invoke_content_generation_with_mcp, invoke_content_revision_with_mcp,
        AnalyticsAgent, OptimizationAgent,
        parse_json_response, create_sample_performance,
        campaign_orchestrator, save_agent_result
    )
    AGENTS_AVAILABLE = True
    print("✅ Strands agents imported successfully")
    print(f"✅ Campaign orchestrator available: {callable(campaign_orchestrator)}")
except ImportError as e:
    print(f"❌ Strands agents not available: {e}")
    AGENTS_AVAILABLE = False
except Exception as e:
    print(f"❌ Error importing agents: {e}")
    AGENTS_AVAILABLE = False

# Import MCP utilities
try:
    from mcp_utils import load_mcp_config, get_oauth_token, test_mcp_connection
    MCP_UTILS_AVAILABLE = True
    print("✅ MCP utilities imported successfully")
except ImportError as e:
    print(f"❌ MCP utilities not available: {e}")
    MCP_UTILS_AVAILABLE = False


def create_sample_performance_from_dict(ads_data: list, product_cost: float) -> list:
    """Create sample performance data from dictionary format ads"""
    import random
    
    performance = []
    for ad in ads_data:
        # Handle both dict and object formats
        platform = ad.get("platform", "Unknown") if isinstance(ad, dict) else getattr(ad, "platform", "Unknown")
        ad_type = ad.get("ad_type", "text_ad") if isinstance(ad, dict) else getattr(ad, "ad_type", "text_ad")
        asset_id = ad.get("asset_id", "unknown") if isinstance(ad, dict) else getattr(ad, "asset_id", "unknown")
        audience = ad.get("audience", "General") if isinstance(ad, dict) else getattr(ad, "audience", "General")
        
        # Skip text ads for performance metrics
        if ad_type == "text_ad":
            continue
            
        base = 1.0
        if platform in ["Instagram", "TikTok"] and ad_type in ["image_ad", "video_ad"]:
            base = 1.5
        elif platform == "LinkedIn":
            base = 1.2
        elif platform == "Facebook":
            base = 0.9
        
        impressions = int(random.randint(5000, 20000) * base)
        clicks = int(impressions * random.uniform(0.01, 0.05) * base)
        redirects = int(clicks * random.uniform(0.3, 0.7))
        conversions = int(redirects * random.uniform(0.05, 0.20) * base)
        likes = int(impressions * random.uniform(0.001, 0.01))
        cost = random.uniform(500, 3000)  # Higher cost for realistic campaign
        revenue = conversions * product_cost
        roi = ((revenue - cost) / cost * 100) if cost > 0 else 0
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        redirect_rate = (redirects / clicks * 100) if clicks > 0 else 0
        
        performance.append({
            "audience": audience,
            "platform": platform,
            "impressions": impressions,
            "clicks": clicks,
            "redirects": redirects,
            "conversions": conversions,
            "likes": likes,
            "cost": round(cost, 2),
            "revenue": round(revenue, 2),
            "roi": round(roi, 1),
            "ctr": round(ctr, 2),
            "redirect_rate": round(redirect_rate, 1)
        })
    
    return performance

async def auto_download_s3_content(session_id: str, content_data: dict, log_output):
    """Automatically download S3 content using robust AWS CLI approach"""
    try:
        if not content_data or "ads" not in content_data:
            log_output("⚠️ No ads found in content data for S3 download")
            return
        
        log_output("📥 Starting automatic S3 media download...")
        
        # Create session-specific download directory
        download_dir = os.path.join("public", "downloads", session_id)
        os.makedirs(download_dir, exist_ok=True)
        
        downloaded_count = 0
        total_s3_items = 0
        
        # Find AWS CLI command
        aws_commands = ['aws', 'aws.cmd', 'aws.exe']
        aws_cmd = None
        
        for cmd in aws_commands:
            try:
                subprocess.run([cmd, '--version'], capture_output=True, check=True, shell=True)
                aws_cmd = cmd
                break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
        
        if not aws_cmd:
            log_output(f"⚠️ AWS CLI not found. Tried: {', '.join(aws_commands)}")
            log_output("S3 download will be skipped. Install AWS CLI for automatic downloads.")
            return
        
        # Process each ad
        for ad in content_data["ads"]:
            asset_id = ad.get('asset_id', 'unknown')
            content = ad.get('content', '')
            ad_type = ad.get('ad_type', 'unknown')
            
            # Skip if content is text (not a URL)
            if not content.startswith(('s3://', 'http://', 'https://')):
                continue
            
            # Skip placeholder URLs - they're already working
            if 'via.placeholder.com' in content:
                log_output(f"ℹ️ {asset_id}: Using placeholder URL (no download needed)")
                continue
            
            total_s3_items += 1
            
            # Determine file extension from content type
            ext_map = {
                'image_ad': '.png',
                'video_ad': '.mp4',
                'text_ad': '.txt'
            }
            extension = ext_map.get(ad_type, '.png')
            
            # Create local filename
            local_filename = os.path.join(download_dir, f"{asset_id}{extension}")
            web_path = f"/public/downloads/{session_id}/{asset_id}{extension}"
            
            # Parse S3 URL
            if content.startswith('s3://'):
                s3_url = content
            elif content.startswith('http'):
                # Convert HTTPS URL to S3 URL format
                from urllib.parse import urlparse
                parsed = urlparse(content)
                # Extract bucket and key from URL like https://bucket.s3.amazonaws.com/key
                if '.s3.amazonaws.com' in parsed.netloc:
                    bucket = parsed.netloc.split('.s3.amazonaws.com')[0]
                    key = parsed.path.lstrip('/')
                    s3_url = f"s3://{bucket}/{key}"
                else:
                    log_output(f"❌ {asset_id}: Could not parse URL format")
                    ad["download_error"] = "Could not parse URL format"
                    continue
            else:
                log_output(f"❌ {asset_id}: Unknown URL format")
                ad["download_error"] = "Unknown URL format"
                continue
            
            # Fix video URLs - add /output.mp4 if missing
            if ad_type == "video_ad" and not s3_url.endswith('.mp4'):
                if '/video-outputs/' in s3_url:
                    s3_url = s3_url.rstrip('/') + '/output.mp4'
                    log_output(f"   🔧 Fixed video URL: {s3_url}")
                    # Also update the original content URL
                    ad["content"] = s3_url
            
            # Download using AWS CLI (same approach as standalone script)
            log_output(f"📥 Downloading {asset_id} from {s3_url[:60]}...")
            try:
                # Use the exact same command structure as the working standalone script
                cmd_list = [aws_cmd, 's3', 'cp', s3_url, local_filename]
                log_output(f"   🔧 Command: {' '.join(cmd_list)}")
                
                result = subprocess.run(
                    cmd_list,
                    capture_output=True,
                    text=True,
                    check=True,
                    shell=True
                )
                log_output(f"✅ Downloaded {asset_id} -> {asset_id}{extension}")
                
                # Update the ad content with local path
                ad["content"] = web_path
                ad["local_downloaded"] = True
                ad["original_s3_url"] = content
                downloaded_count += 1
                
            except subprocess.CalledProcessError as e:
                error_msg = e.stderr.strip()
                if "404" in error_msg or "does not exist" in error_msg:
                    log_output(f"⚠️ {asset_id}: File not found in S3 (expected for some generated content)")
                    ad["download_error"] = "File not available in S3"
                    ad["download_status"] = "not_found"
                else:
                    log_output(f"❌ Failed to download {asset_id}: {error_msg}")
                    log_output(f"   🔍 Return code: {e.returncode}")
                    ad["download_error"] = error_msg
                    ad["download_status"] = "failed"
        
        if total_s3_items > 0:
            log_output(f"📥 S3 Download Summary: {downloaded_count}/{total_s3_items} files downloaded successfully")
            
            # Update the content generation file with local paths
            from market_campaign import save_agent_result
            save_agent_result(session_id, "ContentGenerationAgent", content_data, "content_generation")
            
            # Content is now saved directly to public/agent_outputs by market_campaign.py save_agent_result()
            
            log_output(f"✅ Updated content files with {downloaded_count} local media paths")
        else:
            log_output("ℹ️ No S3 URLs found in content data")
            
    except Exception as e:
        log_output(f"❌ Auto S3 download error: {str(e)}")
        import traceback
        log_output(f"Traceback: {traceback.format_exc()}")

async def execute_real_agents(session_id: str, product: str, product_cost: float, budget: float):
    """Execute real Strands agents using the campaign orchestrator"""
    print(f"🚀 execute_real_agents called for session: {session_id}")
    print(f"📊 AGENTS_AVAILABLE: {AGENTS_AVAILABLE}")
    
    if not AGENTS_AVAILABLE:
        print("❌ Agents not available, cannot execute real agents")
        return
    
    agent_outputs[session_id] = []
    print(f"✅ Starting real agent execution for session: {session_id}")
    
    def log_output(message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        agent_outputs[session_id].append(log_entry)
        print(log_entry)
    
    try:
        # Update session status
        if session_id in sessions:
            sessions[session_id].update({
                "stage": "agent_processing",
                "current_agent": "CampaignOrchestrator",
                "progress": 10
            })
        
        log_output("🚀 CampaignOrchestrator: Starting marketing campaign...")
        log_output(f"📋 Product: {product[:50]}...")
        log_output(f"💰 Budget: ${budget}")
        log_output("🤖 Invoking Strands agents with MCP gateway integration...")
        
        # Prepare payload for campaign orchestrator
        campaign_payload = {
            "action": "start_campaign",
            "product": product,
            "product_cost": product_cost,
            "budget": budget
        }
        
        log_output("📊 Agent Flow: Audience → Budget → Prompts → Content Generation")
        log_output("⏳ This may take 2-3 minutes for MCP image/video generation...")
        
        # Update progress
        if session_id in sessions:
            sessions[session_id].update({
                "current_agent": "AudienceAgent",
                "progress": 25
            })
        
        # Use the campaign orchestrator from market_campaign.py
        log_output("🎯 Calling campaign_orchestrator from market_campaign.py...")
        
        try:
            # Import required functions from market_campaign
            from market_campaign import AudienceAgent, BudgetAgent, PromptAgent, save_agent_result, parse_json_response, create_content_generation_agent
            import json
            import uuid
            
            # Create unique session ID for this campaign
            campaign_session_id = f"session-{str(uuid.uuid4())[:8]}"
            
            # STEP 1: Audience Agent (25% progress)
            log_output("📞 Step 1/4: Calling Audience Agent...")
            aud_response = AudienceAgent(f"Product: {product}\n\nIdentify 3 target audiences with their best 2-3 platforms.")
            aud_data = parse_json_response(aud_response)
            
            # Save audience result
            save_agent_result(session_id, "AudienceAgent", aud_data, "audience_analysis")
            
            log_output("✅ AudienceAgent: Analysis complete!")
            
            # Update session with audience data
            if session_id in sessions:
                if "results" not in sessions[session_id]:
                    sessions[session_id]["results"] = {}
                sessions[session_id]["results"]["audiences"] = aud_data
                sessions[session_id].update({
                    "stage": "budget_allocation",
                    "current_agent": "BudgetAgent",
                    "progress": 25
                })
            
            # Also update the JSON progress file directly for frontend polling
            from market_campaign import OUTPUT_DIR
            import os
            progress_file = os.path.join(OUTPUT_DIR, session_id, "session_progress.json")
            try:
                if os.path.exists(progress_file):
                    with open(progress_file, 'r', encoding='utf-8') as f:
                        progress_data = json.load(f)
                    progress_data.update({
                        "current_stage": "audience_analysis",
                        "progress_percentage": 25,
                        "status": "running"
                    })
                    with open(progress_file, 'w', encoding='utf-8') as f:
                        json.dump(progress_data, f, indent=2, ensure_ascii=False)
            except PermissionError:
                log_output("⚠️ Permission denied writing progress file - continuing without file updates")
            
            await asyncio.sleep(2)  # Brief pause for UI update
            
            # STEP 2: Budget Agent (50% progress)
            log_output("📞 Step 2/4: Calling Budget Agent...")
            budget_input = f"Product: {product}\nTotal Budget: ${budget}\n\nAudiences:\n{json.dumps(aud_data)}\n\nAllocate budget across audiences and platforms."
            budget_response = BudgetAgent(budget_input)
            budget_data = parse_json_response(budget_response)
            
            # Save budget result
            save_agent_result(session_id, "BudgetAgent", budget_data, "budget_allocation")
            
            log_output("✅ BudgetAgent: Budget allocation complete!")
            
            # Update session with budget data
            if session_id in sessions:
                sessions[session_id]["results"]["budget"] = budget_data
                sessions[session_id].update({
                    "stage": "prompt_generation",
                    "current_agent": "PromptAgent",
                    "progress": 50
                })
            
            # Also update the JSON progress file directly for frontend polling
            try:
                if os.path.exists(progress_file):
                    with open(progress_file, 'r', encoding='utf-8') as f:
                        progress_data = json.load(f)
                    progress_data.update({
                        "current_stage": "budget_allocation",
                        "progress_percentage": 50,
                        "status": "running"
                    })
                    with open(progress_file, 'w', encoding='utf-8') as f:
                        json.dump(progress_data, f, indent=2, ensure_ascii=False)
            except PermissionError:
                log_output("⚠️ Permission denied writing progress file - continuing without file updates")
            
            await asyncio.sleep(2)  # Brief pause for UI update
            
            # STEP 3: Prompt Agent (75% progress)
            log_output("📞 Step 3/4: Calling Prompt Agent...")
            prompt_input = f"Product: {product}\n\nAudiences:\n{json.dumps(aud_data)}\n\nBudget:\n{json.dumps(budget_data)}\n\nCreate 2 ad prompts per platform."
            prompt_response = PromptAgent(prompt_input)
            prompt_data = parse_json_response(prompt_response)
            
            # Save prompt result
            save_agent_result(session_id, "PromptAgent", prompt_data, "prompt_strategy")
            
            log_output("✅ PromptAgent: Prompt strategy complete!")
            
            # Update session with prompt data
            if session_id in sessions:
                sessions[session_id]["results"]["prompts"] = prompt_data
                sessions[session_id].update({
                    "stage": "content_generation",
                    "current_agent": "ContentGenerationAgent",
                    "progress": 75
                })
            
            # Also update the JSON progress file directly for frontend polling
            try:
                if os.path.exists(progress_file):
                    with open(progress_file, 'r', encoding='utf-8') as f:
                        progress_data = json.load(f)
                    progress_data.update({
                        "current_stage": "content_generation",
                        "progress_percentage": 75,
                        "status": "running"
                    })
                    with open(progress_file, 'w', encoding='utf-8') as f:
                        json.dump(progress_data, f, indent=2, ensure_ascii=False)
            except PermissionError:
                log_output("⚠️ Permission denied writing progress file - continuing without file updates")
            
            await asyncio.sleep(2)  # Brief pause for UI update
            
            # STEP 4: Content Generation Agent (100% progress)
            log_output("📞 Step 4/4: Calling Content Generation Agent...")
            log_output("⏳ This may take 2-3 minutes for MCP image/video generation...")
            
            # Create content generation agent
            content_agent = create_content_generation_agent()
            
            content_input = f"Product: {product}\n\nAudiences:\n{json.dumps(aud_data)}\n\nBudget:\n{json.dumps(budget_data)}\n\nPrompts:\n{json.dumps(prompt_data)}\n\nGenerate marketing content for all prompts."
            content_response = content_agent(content_input)
            content_data = parse_json_response(content_response)
            
            # Save content result
            save_agent_result(session_id, "ContentGenerationAgent", content_data, "content_generation")
            
            log_output("✅ ContentGenerationAgent: Content generation complete!")
            
            # Automatically download S3 media content
            await auto_download_s3_content(session_id, content_data, log_output)
            
            # Update session with final results
            if session_id in sessions:
                sessions[session_id]["results"]["content"] = content_data
                sessions[session_id].update({
                    "stage": "content_review",
                    "current_agent": "Completed",
                    "progress": 100,
                    "message": "Campaign completed successfully! Review generated content."
                })
            
            # Also update the JSON progress file directly for frontend polling
            try:
                if os.path.exists(progress_file):
                    with open(progress_file, 'r', encoding='utf-8') as f:
                        progress_data = json.load(f)
                    progress_data.update({
                        "current_stage": "content_review",
                        "progress_percentage": 100,
                        "status": "completed"
                    })
                    with open(progress_file, 'w', encoding='utf-8') as f:
                        json.dump(progress_data, f, indent=2, ensure_ascii=False)
            except PermissionError:
                log_output("⚠️ Permission denied writing progress file - continuing without file updates")
            
            log_output("🎉 All agents completed successfully!")
            
        except Exception as orchestrator_error:
            log_output(f"❌ Agent execution error: {str(orchestrator_error)}")
            import traceback
            log_output(f"Traceback: {traceback.format_exc()}")
            
            # Update session with error
            if session_id in sessions:
                sessions[session_id].update({
                    "stage": "error",
                    "error": f"Agent execution failed: {str(orchestrator_error)}"
                })

        
    except Exception as e:
        log_output(f"❌ Agent execution error: {str(e)}")
        import traceback
        log_output(f"Traceback: {traceback.format_exc()}")
        if session_id in sessions:
            sessions[session_id].update({
                "stage": "error",
                "error": str(e)
            })

async def simulate_demo_agents(session_id: str, product: str, budget: float):
    """Fallback demo agent simulation"""
    agent_outputs[session_id] = []
    
    def log_output(message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        agent_outputs[session_id].append(log_entry)
        print(log_entry)
    
    try:
        # Step 1: Audience Analysis (25%)
        log_output("🎯 AudienceAgent: Starting audience analysis...")
        log_output(f"📊 AudienceAgent: Analyzing product: {product[:50]}... (DEMO MODE)")
        await asyncio.sleep(2)
        
        # Create demo audience data
        demo_audience_data = {
            "audiences": [
                {
                    "name": "Health-Conscious Millennials",
                    "demographics": "Ages 25-35, urban professionals, fitness enthusiasts",
                    "platforms": ["Instagram", "TikTok"],
                    "budget": f"${budget * 0.4:.2f}"
                },
                {
                    "name": "Tech-Savvy Gen Z",
                    "demographics": "Ages 18-25, students and early professionals, tech adopters",
                    "platforms": ["TikTok", "YouTube"],
                    "budget": f"${budget * 0.35:.2f}"
                },
                {
                    "name": "Eco-Conscious Families",
                    "demographics": "Ages 30-45, parents, sustainability focused",
                    "platforms": ["Facebook", "Instagram"],
                    "budget": f"${budget * 0.25:.2f}"
                }
            ]
        }
        
        log_output("✅ AudienceAgent: Analysis complete! JSON output:")
        log_output(json.dumps(demo_audience_data, indent=2))
        
        # Save demo audience result to JSON
        from market_campaign import save_agent_result
        save_agent_result(session_id, "AudienceAgent", demo_audience_data, "audience_analysis")
        
        # Update session with audience data
        if session_id in sessions:
            if "results" not in sessions[session_id]:
                sessions[session_id]["results"] = {}
            sessions[session_id]["results"]["audiences"] = demo_audience_data
            sessions[session_id].update({
                "stage": "audience_complete",
                "current_agent": "BudgetAgent",
                "progress": 25
            })
        
        await asyncio.sleep(3)
        
        # Step 2: Budget Agent (50%)
        log_output("💰 BudgetAgent: Starting budget allocation...")
        log_output(f"📈 BudgetAgent: Total budget: ${budget} (DEMO MODE)")
        await asyncio.sleep(2)
        
        # Save demo budget result to JSON
        demo_budget_data = {
            "total_budget": budget,
            "allocations": [
                {"audience": "Health-Conscious Millennials", "amount": budget * 0.4, "percentage": 40},
                {"audience": "Tech-Savvy Gen Z", "amount": budget * 0.35, "percentage": 35},
                {"audience": "Wellness-Focused Parents", "amount": budget * 0.25, "percentage": 25}
            ]
        }
        save_agent_result(session_id, "BudgetAgent", demo_budget_data, "budget_allocation")
        
        log_output("✅ BudgetAgent: Budget allocation complete!")
        
        if session_id in sessions:
            sessions[session_id].update({
                "stage": "budget_complete",
                "current_agent": "PromptAgent",
                "progress": 50
            })
        
        await asyncio.sleep(3)
        
        # Step 3: Prompt Agent (75%)
        log_output("✍️ PromptAgent: Generating ad prompts...")
        log_output("🎨 PromptAgent: Creating platform-specific strategies... (DEMO MODE)")
        await asyncio.sleep(2)
        
        # Save demo prompt result to JSON
        demo_prompt_data = {
            "audience_prompts": [
                {
                    "audience": "Health-Conscious Millennials",
                    "platforms": [{"platform": "Instagram", "prompts": [
                        {"ad_type": "image_ad", "prompt": "Fitness enthusiast using EcoSmart bottle during workout"},
                        {"ad_type": "video_ad", "prompt": "Day in the life with smart hydration tracking"}
                    ]}]
                },
                {
                    "audience": "Tech-Savvy Gen Z", 
                    "platforms": [{"platform": "TikTok", "prompts": [
                        {"ad_type": "video_ad", "prompt": "Tech review of smart water bottle features"},
                        {"ad_type": "image_ad", "prompt": "Sleek bottle with smartphone app interface"}
                    ]}]
                }
            ]
        }
        save_agent_result(session_id, "PromptAgent", demo_prompt_data, "prompt_strategy")
        
        log_output("✅ PromptAgent: Created 6 ad prompts successfully!")
        
        if session_id in sessions:
            sessions[session_id].update({
                "stage": "prompt_complete",
                "current_agent": "ContentGenerationAgent",
                "progress": 75
            })
        
        await asyncio.sleep(3)
        
        # Step 4: Content Generation (100%)
        log_output("🎨 ContentGenerationAgent: Starting MCP integration...")
        log_output("🔗 ContentGenerationAgent: Connecting to MCP Gateway: real-mcp-marketing-gateway-cfc6b1d0-6mdqt3b1cg (DEMO MODE)")
        await asyncio.sleep(2)
        
        log_output("🖼️ ContentGenerationAgent: Calling Nova Canvas for image generation...")
        log_output("🎥 ContentGenerationAgent: Calling Nova Reel for video generation...")
        log_output("📦 ContentGenerationAgent: Uploading assets to S3 bucket: agentcore-demo-172")
        await asyncio.sleep(2)
        
        # Create demo content data
        demo_content_data = {
            "content": [
                {
                    "title": "Instagram Health Focus Ad",
                    "type": "image",
                    "platform": "Instagram",
                    "description": "Vibrant image showing the EcoSmart bottle in a gym setting with hydration tracking display",
                    "url": "https://via.placeholder.com/400x400/667eea/ffffff?text=Health+Focus+Ad"
                },
                {
                    "title": "TikTok Tech Demo Video",
                    "type": "video", 
                    "platform": "TikTok",
                    "description": "15-second video demonstrating smart features and app connectivity",
                    "url": "https://via.placeholder.com/400x400/764ba2/ffffff?text=Tech+Demo+Video"
                },
                {
                    "title": "Facebook Family Ad",
                    "type": "image",
                    "platform": "Facebook",
                    "description": "Family-friendly image highlighting eco-friendly features and UV-C cleaning",
                    "url": "https://via.placeholder.com/400x400/48bb78/ffffff?text=Family+Eco+Ad"
                }
            ]
        }
        
        # Save demo content result to JSON
        save_agent_result(session_id, "ContentGenerationAgent", demo_content_data, "content_generation")
        
        log_output("✅ ContentGenerationAgent: Content generation complete! JSON output:")
        log_output(json.dumps(demo_content_data, indent=2))
        
        # Automatically download S3 media content for demo
        await auto_download_s3_content(session_id, demo_content_data, log_output)
        
        # Update session with content data
        if session_id in sessions:
            sessions[session_id]["results"]["content"] = demo_content_data
            sessions[session_id].update({
                "stage": "content_review",
                "current_agent": "ContentReviewAgent",
                "progress": 100,
                "message": "Content generated successfully! Please review and approve."
            })
        
        log_output("🎉 Demo campaign orchestration completed successfully!")
        
    except Exception as e:
        log_output(f"❌ Demo agent execution error: {str(e)}")
        if session_id in sessions:
            sessions[session_id].update({
                "stage": "error",
                "error": str(e)
            })

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard():
    """Serve the main dashboard HTML"""
    try:
        # Try real-time dashboard first (with Strands integration)
        realtime_path = Path("real_time_dashboard.html")
        if realtime_path.exists():
            return FileResponse(realtime_path, media_type="text/html")
        
        # Try standalone dashboard (no external dependencies)
        standalone_path = Path("standalone_dashboard.html")
        if standalone_path.exists():
            return FileResponse(standalone_path, media_type="text/html")
        
        # Try test dashboard
        test_path = Path("test_dashboard.html")
        if test_path.exists():
            return FileResponse(test_path, media_type="text/html")
        
        # Fallback to main dashboard
        dashboard_path = Path("marketing_campaign_dashboard.html")
        if dashboard_path.exists():
            return FileResponse(dashboard_path, media_type="text/html")
        else:
            return HTMLResponse(f"""
            <html>
                <body>
                    <h1>Dashboard Files Not Found</h1>
                    <p>No dashboard HTML files found</p>
                    <p>Current directory: {os.getcwd()}</p>
                    <p>Files in directory:</p>
                    <ul>
                        {''.join([f'<li>{f}</li>' for f in os.listdir('.') if f.endswith('.html')])}
                    </ul>
                </body>
            </html>
            """)
    except Exception as e:
        return HTMLResponse(f"<html><body><h1>Error</h1><p>{str(e)}</p></body></html>")

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "mode": "live" if AGENTS_AVAILABLE else "demo",
            "agents_available": AGENTS_AVAILABLE,
            "mcp_integration": MCP_UTILS_AVAILABLE,
            "gateway": "real-mcp-marketing-gateway-cfc6b1d0-6mdqt3b1cg"
        }
    except Exception as e:
        print(f"Health check error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "mode": "demo"
        }

@app.post("/api/campaign/start")
async def start_campaign(request: CampaignStartRequest, background_tasks: BackgroundTasks):
    """Start a new marketing campaign with real Strands agents"""
    try:
        session_id = f"session-{int(time.time())}"
        
        # Create initial response
        initial_response = {
            "orchestrator": "CampaignOrchestrator",
            "stage": "initializing",
            "session_id": session_id,
            "message": "Campaign initiated! Strands agents with MCP gateway are starting...",
            "agent_flow": [
                "AudienceAgent → analyzing target demographics ⏳",
                "BudgetAgent → calculating optimal allocation ⏳",
                "PromptAgent → generating ad prompts ⏳",
                "ContentGenerationAgent → creating advertisements with MCP tools ⏳"
            ],
            "current_agent": "Initializing",
            "progress": 0,
            "product": request.product,
            "product_cost": request.product_cost,
            "budget": request.budget,
            "results": {},
            "mcp_tools": {
                "nova_canvas": "Available for image generation",
                "nova_reel": "Available for video generation",
                "s3_bucket": "agentcore-demo-172",
                "gateway": "real-mcp-marketing-gateway-cfc6b1d0-6mdqt3b1cg"
            }
        }
        
        sessions[session_id] = initial_response
        
        # Start real agent execution in background
        if AGENTS_AVAILABLE:
            print(f"Starting real agents for session: {session_id}")
            background_tasks.add_task(
                execute_real_agents, 
                session_id, 
                request.product, 
                request.product_cost, 
                request.budget
            )
        else:
            print(f"Agents not available, using demo mode for session: {session_id}")
            # Fallback to demo mode if agents not available
            background_tasks.add_task(simulate_demo_agents, session_id, request.product, request.budget)
        
        return {"success": True, "data": initial_response}
        
    except Exception as e:
        print(f"Campaign start error: {e}")
        raise HTTPException(status_code=500, detail=f"Campaign start failed: {str(e)}")

@app.post("/api/campaign/feedback")
async def provide_feedback(request: FeedbackRequest):
    """Provide feedback on campaign content - calls real campaign orchestrator"""
    try:
        print(f"📝 Feedback received: {request.feedback_type} for session {request.session_id}")
        
        # Create a unique key for this feedback to prevent duplicate processing
        feedback_key = f"{request.session_id}_{request.feedback_type}"
        
        if feedback_key in processed_feedback:
            print(f"✅ Feedback already processed for {request.session_id}, skipping duplicate call")
            return {"success": True, "data": {"message": "Feedback already processed"}}
        
        # For content approval feedback, just acknowledge it without triggering analytics
        if request.feedback_type == "approve":
            print(f"✅ Content approval acknowledged for {request.session_id}")
            processed_feedback.add(feedback_key)
            return {"success": True, "data": {"message": "Content approval acknowledged. Use 'Proceed to Analytics' button to continue."}}
        
        # For other feedback types, process normally
        if AGENTS_AVAILABLE:
            # Call the real campaign orchestrator for non-approval feedback
            try:
                # First, we need to populate the campaign orchestrator's SESSION_STATE
                # with the session data from our dashboard server
                if request.session_id in sessions:
                    session_data = sessions[request.session_id]
                    
                    # Import SESSION_STATE from market_campaign to populate it
                    from market_campaign import SESSION_STATE
                    
                    # Create the session state structure that the orchestrator expects
                    SESSION_STATE[request.session_id] = {
                        "stage": "content_review",
                        "product": session_data.get("product", "Water resistant smartphone"),
                        "product_cost": session_data.get("product_cost", 89.99),
                        "budget": session_data.get("budget", 100000.0),
                        "audiences": session_data.get("results", {}).get("audiences", {}),
                        "budget_allocation": session_data.get("results", {}).get("budget", {}),
                        "prompts": session_data.get("results", {}).get("prompts", {}),
                        "content": session_data.get("results", {}).get("content", {})
                    }
                    
                    print(f"📊 Populated SESSION_STATE for {request.session_id}")
                
                orchestrator_payload = {
                    "action": "provide_feedback",
                    "session_id": request.session_id,
                    "feedback_type": request.feedback_type,
                    "feedback": request.feedback
                }
                
                print(f"🤖 Calling campaign orchestrator with payload: {orchestrator_payload}")
                orchestrator_result = campaign_orchestrator(orchestrator_payload)
                print(f"✅ Orchestrator result: {orchestrator_result}")
                
                # Mark this feedback as processed to prevent duplicates
                processed_feedback.add(feedback_key)
                
                return {"success": True, "data": orchestrator_result}
                
            except Exception as orchestrator_error:
                print(f"❌ Orchestrator call failed: {orchestrator_error}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                # Fall back to demo mode
                pass
        
        # Fallback demo mode
        if request.session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_data = sessions[request.session_id]
        
        if request.feedback_type == "approve":
            # Campaign completion
            session_data.update({
                "stage": "completed",
                "message": "Campaign completed successfully! All Strands agents with MCP tools collaborated.",
                "agent_flow": [
                    "AudienceAgent → audience analysis ✅",
                    "BudgetAgent → budget allocation ✅",
                    "PromptAgent → ad prompts ✅",
                    "ContentGenerationAgent → ad content with MCP tools ✅",
                    "AnalyticsAgent → performance analysis ✅",
                    "OptimizationAgent → budget optimization ✅"
                ],
                "progress": 100,
                "results": {
                    "audiences": {
                        "audiences": [
                            {
                                "name": "Health-conscious millennials",
                                "demographics": "Ages 25-35 who prioritize wellness and technology",
                                "platforms": [
                                    {
                                        "platform": "Instagram",
                                        "reason": "High engagement with health and lifestyle content"
                                    }
                                ]
                            },
                            {
                                "name": "Tech enthusiasts",
                                "demographics": "Ages 28-45 interested in smart devices",
                                "platforms": [
                                    {
                                        "platform": "LinkedIn",
                                        "reason": "Professional network with tech-savvy audience"
                                    }
                                ]
                            }
                        ]
                    },
                    "content": {
                        "ads": [
                            {
                                "id": "ad_001",
                                "audience": "Health-conscious millennials",
                                "platform": "Instagram",
                                "type": "image_ad",
                                "status": "generated",
                                "title": f"Smart Hydration with {session_data['product'][:30]}",
                                "description": "Generated using Nova Canvas - Premium image showcasing smart water bottle features",
                                "image_url": "https://agentcore-demo-172.s3.amazonaws.com/image-outputs/nova/demo_image_001.png",
                                "created_at": "2024-01-15T10:30:00Z",
                                "feedback_status": "pending"
                            },
                            {
                                "id": "ad_002",
                                "audience": "Tech enthusiasts",
                                "platform": "LinkedIn",
                                "type": "video_ad",
                                "status": "generated",
                                "title": f"Innovation Meets Hydration",
                                "description": "Generated using Nova Reel - 6-second video showcasing smart features",
                                "image_url": "https://agentcore-demo-172.s3.amazonaws.com/video-outputs/demo_video_002_thumb.png",
                                "s3_video_url": "https://agentcore-demo-172.s3.amazonaws.com/video-outputs/demo_video_002.mp4",
                                "created_at": "2024-01-15T10:35:00Z",
                                "feedback_status": "pending"
                            }
                        ]
                    },
                    "performance": [
                        {
                            "audience": "Health-conscious millennials",
                            "platform": "Instagram",
                            "impressions": 15000,
                            "clicks": 750,
                            "roi": 125.5
                        },
                        {
                            "audience": "Tech enthusiasts", 
                            "platform": "LinkedIn",
                            "impressions": 8000,
                            "clicks": 400,
                            "roi": 98.2
                        }
                    ]
                }
            })
            
        elif request.feedback_type == "revise":
            session_data.update({
                "stage": "content_review",
                "message": f"Content revised using MCP tools based on feedback: {request.feedback[:50]}...",
                "agent_flow": [
                    "AudienceAgent → audience analysis ✅",
                    "BudgetAgent → budget allocation ✅",
                    "PromptAgent → ad prompts ✅",
                    "ContentGenerationAgent → ad content ✅",
                    "ContentRevisionAgent → content revision with MCP tools ✅"
                ]
            })
        
        sessions[request.session_id] = session_data
        return {"success": True, "data": session_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail=f"Feedback processing failed: {str(e)}")

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get session data"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"success": True, "data": sessions[session_id]}

@app.get("/api/sessions")
async def list_sessions():
    """List all sessions"""
    return {
        "success": True,
        "sessions": list(sessions.keys()),
        "count": len(sessions)
    }

@app.get("/api/session/{session_id}/progress")
async def get_session_progress_api(session_id: str):
    """Get session progress from JSON files"""
    try:
        from market_campaign import get_session_progress
        progress_data = get_session_progress(session_id)
        
        return {
            "success": True,
            "session_id": session_id,
            "progress": progress_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting progress: {str(e)}")

@app.get("/api/session/{session_id}/agent/{agent_name}")
async def get_agent_result_api(session_id: str, agent_name: str):
    """Get specific agent result from JSON files"""
    try:
        from market_campaign import get_agent_result
        agent_data = get_agent_result(session_id, agent_name)
        
        return {
            "success": True,
            "session_id": session_id,
            "agent": agent_name,
            "data": agent_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting agent result: {str(e)}")

@app.get("/api/session/{session_id}/results")
async def get_all_results(session_id: str):
    """Get all agent results for a session with automatic S3 media download"""
    try:
        from market_campaign import get_agent_result
        
        agents = ["AudienceAgent", "BudgetAgent", "PromptAgent", "ContentGenerationAgent"]
        results = {}
        
        for agent in agents:
            agent_data = get_agent_result(session_id, agent)
            if "error" not in agent_data:
                results[agent.lower()] = agent_data
                
                # Auto-download S3 media for ContentGenerationAgent
                if agent == "ContentGenerationAgent" and "result" in agent_data:
                    content_result = agent_data["result"]
                    if "ads" in content_result:
                        for ad in content_result["ads"]:
                            if ad.get("content") and (ad["content"].startswith("s3://") or ad["content"].startswith("https://")):
                                # Download S3 media to public directory
                                download_request = {
                                    "s3_path": ad["content"],
                                    "asset_id": ad.get("asset_id", f"ad_{ad.get('id', 'unknown')}"),
                                    "ad_type": ad.get("ad_type", "image_ad")
                                }
                                download_result = await download_s3_content(download_request)
                                if download_result.get("success"):
                                    # Update the ad content with local URL
                                    ad["local_url"] = download_result["local_url"]
                                    ad["local_path"] = download_result["local_path"]
                                    print(f"✅ Downloaded {ad['content']} to {download_result['local_url']}")
        
        return {
            "success": True,
            "session_id": session_id,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting results: {str(e)}")

@app.post("/api/download-s3-content")
async def download_s3_content(request: dict):
    """Download content from S3 and serve it locally in public directory"""
    try:
        s3_path = request.get("s3_path")
        asset_id = request.get("asset_id")
        ad_type = request.get("ad_type")
        
        if not s3_path:
            raise HTTPException(status_code=400, detail="S3 path is required")
        
        # Create public directory for serving media files
        public_dir = "public"
        media_dir = os.path.join(public_dir, "media")
        os.makedirs(media_dir, exist_ok=True)
        
        # Determine file extension based on ad type and S3 path
        if ad_type == "image_ad" or ".png" in s3_path or ".jpg" in s3_path:
            file_ext = ".png" if ".png" in s3_path else ".jpg"
        elif ad_type == "video_ad" or ".mp4" in s3_path:
            file_ext = ".mp4"
        else:
            file_ext = ".png"  # Default
        
        local_filename = f"{asset_id}{file_ext}"
        local_path = os.path.join(media_dir, local_filename)
        
        # Download from S3 using AWS CLI
        if s3_path.startswith("s3://"):
            import subprocess
            cmd = ["aws", "s3", "cp", s3_path, local_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Serve the file via public media endpoint
                local_url = f"/public/media/{local_filename}"
                return {
                    "success": True,
                    "local_url": local_url,
                    "local_path": local_path
                }
            else:
                print(f"AWS S3 download failed: {result.stderr}")
                return {"success": False, "error": f"S3 download failed: {result.stderr}"}
        
        elif s3_path.startswith("https://"):
            # Download from HTTPS URL
            import requests
            response = requests.get(s3_path)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                
                local_url = f"/public/media/{local_filename}"
                return {
                    "success": True,
                    "local_url": local_url,
                    "local_path": local_path
                }
            else:
                return {"success": False, "error": f"HTTP download failed: {response.status_code}"}
        
        return {"success": False, "error": "Invalid S3 path format"}
        
    except Exception as e:
        print(f"Error downloading S3 content: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/campaign/revision")
async def content_revision(request: dict):
    """Handle content revision requests"""
    try:
        session_id = request.get("session_id")
        ad_id = request.get("ad_id")
        feedback = request.get("feedback")
        
        if not all([session_id, ad_id, feedback]):
            return {"success": False, "error": "Missing required fields"}
        
        print(f"📝 Content revision request for session {session_id}, ad {ad_id}")
        print(f"💬 Feedback: {feedback}")
        
        # Import the revision function
        from market_campaign import invoke_content_revision_with_mcp, get_agent_result
        
        # Get current content data
        try:
            content_data = get_agent_result(session_id, "ContentGenerationAgent")
            if not content_data:
                return {"success": False, "error": "No content data found"}
        except Exception as e:
            return {"success": False, "error": f"Failed to load content data: {str(e)}"}
        
        # Find the specific ad to revise
        ads = content_data.get("result", {}).get("ads", [])
        target_ad = None
        for ad in ads:
            if ad.get("asset_id") == ad_id:
                target_ad = ad
                break
        
        if not target_ad:
            return {"success": False, "error": f"Ad {ad_id} not found"}
        
        # Create revision request
        revision_input = f"""
        Revise this ad based on the feedback:
        
        Original Ad:
        - Audience: {target_ad.get('audience')}
        - Platform: {target_ad.get('platform')}
        - Type: {target_ad.get('ad_type')}
        - Content: {target_ad.get('content')}
        
        Feedback: {feedback}
        
        Please generate revised content that addresses the feedback while maintaining the same ad type and target audience.
        """
        
        # Call the revision agent
        revision_result = invoke_content_revision_with_mcp(revision_input)
        
        if revision_result.get("success"):
            print(f"✅ Content revision completed for ad {ad_id}")
            
            # Process the revised content
            revised_content = revision_result.get("result")
            
            # If it's an image or video ad, download the new S3 content
            if target_ad.get('ad_type') in ['image_ad', 'video_ad'] and revised_content:
                try:
                    # Import download utilities
                    import subprocess
                    import os
                    from pathlib import Path
                    
                    # Parse the revised content to extract S3 URLs
                    if isinstance(revised_content, str):
                        # Look for S3 URLs in the response
                        import re
                        s3_pattern = r's3://agentcore-demo-172/[^\s\'"]*'
                        s3_urls = re.findall(s3_pattern, revised_content)
                        
                        if s3_urls:
                            s3_uri = s3_urls[0]  # Use the first S3 URL found
                            
                            # Determine local path based on ad type
                            if target_ad.get('ad_type') == 'image_ad':
                                filename = s3_uri.split('/')[-1]
                                if not filename.endswith(('.png', '.jpg', '.jpeg')):
                                    filename += '.png'
                                local_dir = Path("public/downloads/images")
                                local_path = local_dir / filename
                                web_path = f"/downloads/images/{filename}"
                            else:  # video_ad
                                video_id = s3_uri.split('video-outputs/')[-1].split('/')[0]
                                filename = f"{video_id}.mp4"
                                local_dir = Path("public/downloads/videos")
                                local_path = local_dir / filename
                                web_path = f"/downloads/videos/{filename}"
                            
                            # Create directory if it doesn't exist
                            local_dir.mkdir(parents=True, exist_ok=True)
                            
                            # Download using AWS CLI
                            download_command = f'aws s3 cp "{s3_uri}" "{local_path}"'
                            print(f"📥 Downloading revised content: {s3_uri}")
                            
                            result = subprocess.run(download_command, shell=True, capture_output=True, text=True)
                            
                            if result.returncode == 0:
                                print(f"✅ Downloaded revised content to: {local_path}")
                                
                                # Update the content generation file with new local path
                                for i, ad in enumerate(ads):
                                    if ad.get("asset_id") == ad_id:
                                        ads[i]["content"] = web_path
                                        ads[i]["local_downloaded"] = True
                                        ads[i]["revised"] = True
                                        ads[i]["revision_feedback"] = feedback
                                        break
                                
                                # Save updated content generation file
                                from market_campaign import save_agent_result
                                save_agent_result(session_id, "ContentGenerationAgent", content_data["result"], "content_generation")
                                
                                # Content is now saved directly to public/agent_outputs by market_campaign.py save_agent_result()
                                
                                print(f"✅ Updated content files with revised local path: {web_path}")
                                
                            else:
                                print(f"❌ Failed to download revised content: {result.stderr}")
                        
                except Exception as download_error:
                    print(f"⚠️ Failed to download revised content: {download_error}")
            
            return {
                "success": True,
                "message": "Content revision completed successfully",
                "revised_content": revised_content
            }
        else:
            return {
                "success": False,
                "error": revision_result.get("error", "Revision failed")
            }
        
    except Exception as e:
        print(f"❌ Content revision error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/campaign/advanced-revision")
async def advanced_revision(request: dict):
    """Handle advanced content revision requests"""
    try:
        session_id = request.get("session_id")
        asset_id = request.get("asset_id")
        feedback = request.get("feedback")
        revision_type = request.get("revision_type", "standard")
        
        if not all([session_id, asset_id, feedback]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Import the advanced revision workflow
        from market_campaign import advanced_content_revision_workflow, get_agent_result
        
        # Get current content data
        content_data = get_agent_result(session_id, "ContentGenerationAgent")
        if "error" in content_data:
            raise HTTPException(status_code=404, detail="Content data not found")
        
        # Prepare feedback for the specific asset
        feedback_data = {
            "asset_id": asset_id,
            "feedback": feedback,
            "revision_type": revision_type,
            "timestamp": datetime.now().isoformat()
        }
        
        # Run advanced revision workflow
        revision_result = advanced_content_revision_workflow(
            content_data["result"], 
            feedback_data, 
            revision_type
        )
        
        if revision_result["status"] == "completed":
            # Save the revised content
            from market_campaign import save_agent_result
            save_agent_result(session_id, "ContentGenerationAgent", revision_result["revised_content"], "content_revision")
            
            return {
                "success": True,
                "message": "Content revision completed successfully",
                "revision_result": revision_result
            }
        else:
            return {
                "success": False,
                "error": revision_result.get("error", "Revision failed")
            }
        
    except Exception as e:
        print(f"Advanced revision error: {e}")
        raise HTTPException(status_code=500, detail=f"Revision failed: {str(e)}")

@app.get("/api/session/{session_id}/output")
async def get_agent_output(session_id: str):
    """Get real-time agent output for a session"""
    if session_id not in agent_outputs:
        raise HTTPException(status_code=404, detail="Session output not found")
    
    return {
        "success": True,
        "output": agent_outputs[session_id],
        "count": len(agent_outputs[session_id])
    }

@app.get("/api/session/{session_id}/stream")
async def stream_agent_output(session_id: str):
    """Stream real-time agent output"""
    async def generate_stream():
        last_count = 0
        while True:
            if session_id in agent_outputs:
                current_output = agent_outputs[session_id]
                if len(current_output) > last_count:
                    # Send new output lines
                    new_lines = current_output[last_count:]
                    for line in new_lines:
                        yield f"data: {json.dumps({'type': 'output', 'content': line})}\n\n"
                    last_count = len(current_output)
                
                # Send session updates
                if session_id in sessions:
                    session_data = sessions[session_id]
                    yield f"data: {json.dumps({'type': 'session', 'data': session_data})}\n\n"
            
            await asyncio.sleep(1)  # Check every second
            
            # Stop streaming if session is complete or error
            if session_id in sessions:
                stage = sessions[session_id].get('stage')
                if stage in ['completed', 'error', 'content_review']:
                    break
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.post("/api/campaign/proceed-to-analytics")
async def proceed_to_analytics(request: dict):
    """Proceed to Analytics - triggers both analytics and optimization agents"""
    try:
        session_id = request.get("session_id")
        
        # Rate limiting check
        current_time = time.time()
        session_requests = analytics_request_times[session_id]
        
        # Remove old requests (older than rate limit)
        session_requests[:] = [req_time for req_time in session_requests if current_time - req_time < ANALYTICS_RATE_LIMIT]
        
        # Check if too many recent requests
        if session_requests:
            time_since_last = current_time - session_requests[-1]
            if time_since_last < ANALYTICS_RATE_LIMIT:
                print(f"🚫 Rate limited analytics request for {session_id} (last request {time_since_last:.1f}s ago)")
                return {"success": True, "data": {"message": "Request rate limited. Please wait before trying again."}}
        
        # Record this request
        session_requests.append(current_time)

        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        print(f"🎯 Proceeding to Analytics for session {session_id}")
        
        # Check if already processed (prevent spam)
        analytics_key = f"{session_id}_analytics_proceed"
        if analytics_key in processed_feedback:
            print(f"✅ Analytics already processed for {session_id}")
            
            # Return existing analytics data if available
            try:
                from market_campaign import get_agent_result
                analytics_data = get_agent_result(session_id, "AnalyticsAgent")
                optimization_data = get_agent_result(session_id, "OptimizationAgent")
                
                return {
                    "success": True, 
                    "data": {
                        "message": "Analytics and optimization already completed",
                        "analytics": analytics_data.get("result") if "error" not in analytics_data else None,
                        "optimization": optimization_data.get("result") if "error" not in optimization_data else None
                    }
                }
            except:
                return {"success": True, "data": {"message": "Analytics and optimization already completed"}}
        
        if AGENTS_AVAILABLE:
            try:
                # Populate SESSION_STATE for orchestrator
                if session_id in sessions:
                    session_data = sessions[session_id]
                    
                    from market_campaign import SESSION_STATE
                    
                    SESSION_STATE[session_id] = {
                        "stage": "content_review",
                        "product": session_data.get("product", "Product"),
                        "product_cost": session_data.get("product_cost", 50.0),
                        "budget": session_data.get("budget", 100000.0),
                        "audiences": session_data.get("results", {}).get("audiences", {}),
                        "budget_allocation": session_data.get("results", {}).get("budget", {}),
                        "prompts": session_data.get("results", {}).get("prompts", {}),
                        "content": session_data.get("results", {}).get("content", {})
                    }
                
                # Call orchestrator with analytics action
                orchestrator_payload = {
                    "action": "provide_feedback",
                    "session_id": session_id,
                    "feedback_type": "approve",
                    "feedback": "All content approved - proceed to analytics and optimization"
                }
                
                print(f"🤖 Calling orchestrator for analytics: {orchestrator_payload}")
                orchestrator_result = campaign_orchestrator(orchestrator_payload)
                
                # CRITICAL FIX: Convert orchestrator result to JSON-serializable format IMMEDIATELY
                # This prevents "GeneratedAd is not JSON serializable" errors
                try:
                    # Convert the entire result to JSON and back to ensure it's serializable
                    orchestrator_result = json.loads(json.dumps(orchestrator_result, default=lambda o: o.__dict__ if hasattr(o, '__dict__') else str(o)))
                    print(f"✅ Converted orchestrator result to JSON-serializable format")
                except Exception as conv_error:
                    print(f"⚠️ Could not convert orchestrator result: {conv_error}")
                
                # Mark as processed
                processed_feedback.add(analytics_key)
                
                # Save results - ALWAYS save if analytics/optimization data exists, regardless of stage
                if "analytics" in orchestrator_result and orchestrator_result["analytics"]:
                    analytics_data = orchestrator_result["analytics"]
                    save_agent_result(session_id, "AnalyticsAgent", analytics_data, "analytics")
                    print(f"✅ Saved analytics result for session {session_id}")
                
                if "optimization" in orchestrator_result and orchestrator_result["optimization"]:
                    optimization_data = orchestrator_result["optimization"]
                    save_agent_result(session_id, "OptimizationAgent", optimization_data, "optimization")
                    print(f"✅ Saved optimization result for session {session_id}")
                
                return {"success": True, "data": orchestrator_result}
                
            except Exception as e:
                print(f"❌ Orchestrator analytics failed: {e}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                
                # Try to extract and save the data from orchestrator_result even if there was an error
                try:
                    if "analytics" in orchestrator_result:
                        # Try to parse as JSON string if it's a string
                        analytics_data = orchestrator_result["analytics"]
                        if isinstance(analytics_data, str):
                            analytics_data = json.loads(analytics_data)
                        save_agent_result(session_id, "AnalyticsAgent", analytics_data, "analytics")
                        print(f"✅ Saved analytics result despite error")
                    
                    if "optimization" in orchestrator_result:
                        optimization_data = orchestrator_result["optimization"]
                        if isinstance(optimization_data, str):
                            optimization_data = json.loads(optimization_data)
                        save_agent_result(session_id, "OptimizationAgent", optimization_data, "optimization")
                        print(f"✅ Saved optimization result despite error")
                except Exception as save_error:
                    print(f"⚠️ Could not save orchestrator results: {save_error}")
                
                # Fall back to individual agents
                pass
        
        # ALWAYS use fallback: call individual analytics and optimization endpoints
        # This is more reliable than the orchestrator which has session state issues
        print("📊 Using direct analytics and optimization endpoints (more reliable)")
        
        # Call analytics
        analytics_result = await execute_analytics({"session_id": session_id})
        
        # Call optimization  
        optimization_result = await execute_optimization({"session_id": session_id})
        
        processed_feedback.add(analytics_key)
        
        print(f"✅ Analytics and optimization completed for session {session_id}")
        
        return {
            "success": True, 
            "data": {
                "analytics": analytics_result.get("data"),
                "optimization": optimization_result.get("data"),
                "message": "Analytics and optimization completed successfully"
            }
        }
        
    except Exception as e:
        print(f"❌ Proceed to analytics failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics workflow failed: {str(e)}")

@app.post("/api/campaign/analytics")
async def execute_analytics(request: dict):
    """Execute Analytics Agent for performance analysis"""
    try:
        session_id = request.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        print(f"📊 Analytics Agent: Starting performance analysis for session {session_id}")
        
        if AGENTS_AVAILABLE:
            try:
                # Import analytics functions
                from market_campaign import AnalyticsAgent, get_agent_result, save_agent_result, parse_json_response, create_sample_performance
                
                # Get existing campaign data
                audience_data = get_agent_result(session_id, "AudienceAgent")
                content_data = get_agent_result(session_id, "ContentGenerationAgent")
                
                if "error" in audience_data or "error" in content_data:
                    raise Exception("Required campaign data not found")
                
                # Create performance data for analysis
                ads_data = content_data.get("result", {}).get("ads", [])
                product_cost = 299.99  # Default product cost, should be from session data
                
                # Convert ads dict to proper format for create_sample_performance
                performance_data = create_sample_performance_from_dict(ads_data, product_cost)
                
                # Prepare analytics input
                analytics_input = f"""
                Analyze the performance of this marketing campaign:
                
                Campaign Data:
                {json.dumps(audience_data.get("result", {}), indent=2)}
                
                Content Generated:
                {json.dumps(content_data.get("result", {}), indent=2)}
                
                Performance Metrics:
                {json.dumps(performance_data, indent=2)}
                
                Provide comprehensive performance analysis including ROI, platform effectiveness, and optimization recommendations.
                """
                
                # Execute Analytics Agent
                analytics_response = AnalyticsAgent(analytics_input)
                analytics_result = parse_json_response(analytics_response)
                
                # Save analytics result
                save_agent_result(session_id, "AnalyticsAgent", analytics_result, "analytics")
                
                print(f"✅ Analytics Agent completed for session {session_id}")
                
                return {
                    "success": True,
                    "message": "Analytics analysis completed successfully",
                    "data": analytics_result
                }
                
            except Exception as e:
                print(f"❌ Analytics Agent error: {e}")
                # Fall back to demo analytics
                pass
        
        # Demo analytics fallback - matches frontend expected structure
        demo_analytics = {
            "product_cost": 299.99,
            "total_revenue": 28500.0,
            "total_cost": 20000.0,
            "overall_roi": 42.5,
            "best_performing": "Instagram - Health-conscious millennials",
            "platform_metrics": [
                {
                    "audience": "Health-conscious millennials",
                    "platform": "Instagram",
                    "impressions": 15000,
                    "clicks": 750,
                    "redirects": 525,
                    "conversions": 45,
                    "likes": 1200,
                    "cost": 8000.0,
                    "revenue": 13495.50,
                    "roi": 68.7,
                    "ctr": 5.0,
                    "redirect_rate": 70.0
                },
                {
                    "audience": "Fitness enthusiasts",
                    "platform": "TikTok", 
                    "impressions": 12000,
                    "clicks": 600,
                    "redirects": 420,
                    "conversions": 38,
                    "likes": 960,
                    "cost": 7000.0,
                    "revenue": 11399.62,
                    "roi": 62.9,
                    "ctr": 5.0,
                    "redirect_rate": 70.0
                },
                {
                    "audience": "Busy parents",
                    "platform": "Facebook",
                    "impressions": 10000,
                    "clicks": 500,
                    "redirects": 300,
                    "conversions": 32,
                    "likes": 600,
                    "cost": 5000.0,
                    "revenue": 9596.88,
                    "roi": 91.9,
                    "ctr": 5.0,
                    "redirect_rate": 60.0
                }
            ],
            "insights": {
                "top_performer": {
                    "audience": "Health-conscious millennials",
                    "platform": "Instagram",
                    "reason": "Highest ROI and engagement"
                },
                "underperformer": {
                    "audience": "Busy parents",
                    "platform": "Facebook",
                    "reason": "Lower conversion rates"
                },
                "recommendations": [
                    "Increase budget allocation to Instagram by 20%",
                    "Optimize TikTok content for higher engagement",
                    "Test video ads on Facebook for better performance"
                ]
            }
        }
        
        # Save demo analytics result
        from market_campaign import save_agent_result
        save_agent_result(session_id, "AnalyticsAgent", demo_analytics, "analytics")
        
        return {
            "success": True,
            "message": "Analytics analysis completed (demo mode)",
            "data": demo_analytics
        }
        
    except Exception as e:
        print(f"❌ Analytics execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics execution failed: {str(e)}")

@app.post("/api/campaign/optimization")
async def execute_optimization(request: dict):
    """Execute Optimization Agent for budget and strategy optimization"""
    try:
        session_id = request.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        print(f"🎯 Optimization Agent: Starting optimization analysis for session {session_id}")
        
        if AGENTS_AVAILABLE:
            try:
                # Import optimization functions
                from market_campaign import OptimizationAgent, get_agent_result, save_agent_result, parse_json_response
                
                # Get existing campaign and analytics data
                analytics_data = get_agent_result(session_id, "AnalyticsAgent")
                audience_data = get_agent_result(session_id, "AudienceAgent")
                budget_data = get_agent_result(session_id, "BudgetAgent")
                
                if "error" in analytics_data:
                    raise Exception("Analytics data required for optimization")
                
                # Prepare optimization input
                optimization_input = f"""
                Based on the campaign performance analysis, provide optimization recommendations:
                
                Analytics Results:
                {json.dumps(analytics_data.get("result", {}), indent=2)}
                
                Original Budget Allocation:
                {json.dumps(budget_data.get("result", {}), indent=2)}
                
                Target Audiences:
                {json.dumps(audience_data.get("result", {}), indent=2)}
                
                Provide specific budget reallocation recommendations, platform optimization strategies, and content improvement suggestions.
                """
                
                # Execute Optimization Agent
                optimization_response = OptimizationAgent(optimization_input)
                optimization_result = parse_json_response(optimization_response)
                
                # Save optimization result
                save_agent_result(session_id, "OptimizationAgent", optimization_result, "optimization")
                
                print(f"✅ Optimization Agent completed for session {session_id}")
                
                return {
                    "success": True,
                    "message": "Optimization analysis completed successfully",
                    "data": optimization_result
                }
                
            except Exception as e:
                print(f"❌ Optimization Agent error: {e}")
                # Fall back to demo optimization
                pass
        
        # Demo optimization fallback - matches frontend expected structure
        demo_optimization = {
            "summary": "Based on performance analysis, reallocating budget from lower-performing Facebook ads to high-ROI Instagram campaigns will increase overall ROI by 25%. TikTok shows strong engagement potential with content optimization.",
            "recommendations": [
                "Increase Instagram budget by 25% due to highest ROI performance at 68.7%",
                "Boost TikTok investment by 21% - strong engagement potential with trending content",
                "Increase Facebook allocation by 30% - test video content for better performance",
                "Focus on video content for Instagram - highest engagement rates",
                "Optimize TikTok content with trending audio and hashtags for better reach"
            ],
            "projected_roi_improvement": 25.0,
            "projected_revenue_increase": 7125.0,
            "budget_changes": [
                {
                    "audience": "Health-conscious millennials",
                    "platform": "Instagram",
                    "old_amount": 8000.0,
                    "new_amount": 10000.0,
                    "change": 25.0
                },
                {
                    "audience": "Fitness enthusiasts",
                    "platform": "TikTok",
                    "old_amount": 7000.0,
                    "new_amount": 8470.0,
                    "change": 21.0
                },
                {
                    "audience": "Busy parents",
                    "platform": "Facebook",
                    "old_amount": 5000.0,
                    "new_amount": 6500.0,
                    "change": 30.0
                }
            ],
            "forecasting": {
                "30_day_revenue": 35625.0,
                "new_roi": 53.1,
                "efficiency_improvement": "25% better performance expected"
            }
        }
        
        # Save demo optimization result
        from market_campaign import save_agent_result
        save_agent_result(session_id, "OptimizationAgent", demo_optimization, "optimization")
        
        return {
            "success": True,
            "message": "Optimization analysis completed (demo mode)",
            "data": demo_optimization
        }
        
    except Exception as e:
        print(f"❌ Optimization execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization execution failed: {str(e)}")

@app.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "Server is working!", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    
    print("Starting Marketing Campaign Dashboard Server")
    print("=" * 60)
    print("Mode: Demo (Strands Agents + MCP Gateway simulation)")
    print("MCP Gateway: real-mcp-marketing-gateway-cfc6b1d0-6mdqt3b1cg")
    print("Dashboard: http://localhost:8002")
    print("API Docs: http://localhost:8002/docs")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8002)

@app.get("/simple")
async def simple_page():
    """Ultra simple HTML page"""
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Simple Test</title>
        <style>
            body { font-family: Arial; padding: 20px; background: #f0f0f0; }
            .box { background: white; padding: 20px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>✅ Dashboard Server is Working!</h1>
            <p>If you can see this, the server is running correctly.</p>
            <p><a href="/">Go to Main Dashboard</a></p>
            <p><a href="/health">Health Check</a></p>
            <p><a href="/docs">API Documentation</a></p>
        </div>
    </body>
    </html>
    """)