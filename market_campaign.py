import boto3
from bedrock_agentcore import BedrockAgentCoreApp
from strands.agent import Agent
from strands.models import BedrockModel
from strands_tools import generate_image
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import json
import uuid
import os
import requests
from datetime import datetime, timedelta

# MCP imports (with fallback handling)
try:
    from strands.tools.mcp.mcp_client import MCPClient
    from bedrock_agentcore.runtime import BedrockAgentCoreApp as AgentCoreApp
    MCP_AVAILABLE = True
    print("✅ MCP imports successful")
except ImportError as e:
    print(f"⚠️ MCP imports failed: {e}")
    MCP_AVAILABLE = False

try:
    from mcp.client.streamable_http import streamablehttp_client
    STREAMABLE_HTTP_AVAILABLE = True
    print("✅ Streamable HTTP client available")
except ImportError:
    print("⚠️ Streamable HTTP client not available")

# Import MCP utilities
try:
    import mcp_utils
    print("✅ MCP utilities imported")
except ImportError:
    print("⚠️ MCP utilities not available")
    STREAMABLE_HTTP_AVAILABLE = False

# Initialize the BedrockAgentCoreApp (using default ping handler)
app = BedrockAgentCoreApp()

# Store session state (in production, use Redis or DynamoDB)
SESSION_STATE = {}

# Create output directory for agent results (use public directory for frontend access)
OUTPUT_DIR = "public/agent_outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_agent_result(session_id: str, agent_name: str, result_data: dict, stage: str = None):
    """Save agent result to JSON file for UI tracking"""
    try:
        timestamp = datetime.now().isoformat()
        
        # Create session directory
        session_dir = os.path.join(OUTPUT_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save individual agent result
        agent_file = os.path.join(session_dir, f"{agent_name.lower()}_result.json")
        agent_result = {
            "agent": agent_name,
            "timestamp": timestamp,
            "stage": stage or agent_name.lower(),
            "status": "completed",
            "result": result_data
        }
        
        with open(agent_file, 'w', encoding='utf-8') as f:
            json.dump(agent_result, f, indent=2, ensure_ascii=False)
        
        # Update session progress file
        progress_file = os.path.join(session_dir, "session_progress.json")
        
        # Load existing progress or create new
        if os.path.exists(progress_file):
            with open(progress_file, 'r', encoding='utf-8') as f:
                progress_data = json.load(f)
        else:
            progress_data = {
                "session_id": session_id,
                "started_at": timestamp,
                "agents_completed": [],
                "current_stage": "initializing",
                "progress_percentage": 0,
                "status": "running"
            }
        
        # Update progress
        if agent_name not in progress_data["agents_completed"]:
            progress_data["agents_completed"].append(agent_name)
        
        progress_data["current_stage"] = stage or agent_name.lower()
        progress_data["last_updated"] = timestamp
        
        # Calculate progress percentage
        total_agents = 6  # AudienceAgent, BudgetAgent, PromptAgent, ContentGenerationAgent, AnalyticsAgent, OptimizationAgent
        completed_count = len(progress_data["agents_completed"])
        progress_data["progress_percentage"] = min(100, (completed_count / total_agents) * 100)
        
        # Save updated progress
        with open(progress_file, 'w', encoding='utf-8') as f:
            json.dump(progress_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved {agent_name} result to {agent_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving agent result: {e}")
        return False

def get_session_progress(session_id: str) -> dict:
    """Get current session progress from JSON files"""
    try:
        session_dir = os.path.join(OUTPUT_DIR, session_id)
        progress_file = os.path.join(session_dir, "session_progress.json")
        
        if os.path.exists(progress_file):
            with open(progress_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {"error": "Session not found"}
    except Exception as e:
        return {"error": str(e)}

def get_agent_result(session_id: str, agent_name: str) -> dict:
    """Get specific agent result from JSON file"""
    try:
        session_dir = os.path.join(OUTPUT_DIR, session_id)
        agent_file = os.path.join(session_dir, f"{agent_name.lower()}_result.json")
        
        if os.path.exists(agent_file):
            with open(agent_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {"error": f"{agent_name} result not found"}
    except Exception as e:
        return {"error": str(e)}

# Initialize model
model = BedrockModel(
    model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    region_name="us-east-1",
    temperature=0.7,
    max_tokens=8000
)

# -----------------------------
# Pydantic Models
# -----------------------------

class PlatformInfo(BaseModel):
    platform: str
    reason: str

class AudienceGroup(BaseModel):
    name: str
    demographics: str
    platforms: List[PlatformInfo]

class AudienceAnalysis(BaseModel):
    audiences: List[AudienceGroup]

class PlatformBudget(BaseModel):
    platform: str
    amount: float
    percentage: float

class AudienceBudget(BaseModel):
    audience: str
    total: float
    platforms: List[PlatformBudget]

class BudgetAllocation(BaseModel):
    total_budget: float
    allocations: List[AudienceBudget]

class AdPrompt(BaseModel):
    ad_type: str
    prompt: str
    cta: str

class PlatformPrompts(BaseModel):
    platform: str
    prompts: List[AdPrompt]

class AudiencePrompts(BaseModel):
    audience: str
    platforms: List[PlatformPrompts]

class PromptStrategy(BaseModel):
    audience_prompts: List[AudiencePrompts]

class GeneratedAd(BaseModel):
    asset_id: str
    audience: str
    platform: str
    ad_type: str
    content: str
    status: str

class ContentGeneration(BaseModel):
    ads: List[GeneratedAd]

class CalculatedMetrics(BaseModel):
    audience: str
    platform: str
    impressions: int
    clicks: int
    redirects: int
    conversions: int
    likes: int
    cost: float
    revenue: float
    roi: float
    ctr: float
    redirect_rate: float

class PerformanceAnalysis(BaseModel):
    product_cost: float
    total_revenue: float
    total_cost: float
    overall_roi: float
    platform_metrics: List[CalculatedMetrics]
    best_performing: str
    worst_performing: str

class BudgetChange(BaseModel):
    audience: str
    platform: str
    old_amount: float
    new_amount: float
    change: float

class OptimizationDecision(BaseModel):
    summary: str
    recommendations: List[str]
    budget_changes: List[BudgetChange]

# -----------------------------
# Define Agents
# -----------------------------

AudienceAgent = Agent(
    model=model,
    system_prompt=f"""You are an expert market specialist.
    You need to identify the most suitable target audiences for the product.
    Output 3 audiences with their most suitable platform (one platform per audience group only).
    Keep descriptions brief (max 20 words each).    
    Output JSON:
    {json.dumps(AudienceAnalysis.model_json_schema(), indent=2)}
    Return ONLY valid JSON."""
)

BudgetAgent = Agent(
    model=model,
    system_prompt=f"""You are a marketing budget planner
    You need to allocate/split the budget across audiences's respective social media platforms strategically.
    It should be based on ROI and platform costs. 
    Consider which audience will benefit the most from the product and allocate accordingly.
    Output JSON:
    {json.dumps(BudgetAllocation.model_json_schema(), indent=2)}
    Ensure percentages sum to 100%. Return ONLY valid JSON."""
)

PromptAgent = Agent(
    model=model,
    system_prompt=f"""You are an ad creative strategist.
    For each audience-platform, you need to decide what ad types(text_ad, image_ad, video_ad) would work the best.
    Then you need to create concise, actionable ad prompts that can be used for content generation.
    Use prompt engineering to ensure that this prompt caters to the right audience and describes the product well so that it can be used by other LLM models to generate  a good advertisement of the product.
    Keep prompts descriptive under 50 words. 
    Ensure that the image and video ad prompts should NOT suggest a text displayed on the ad
    Output JSON:
    {json.dumps(PromptStrategy.model_json_schema(), indent=2)}
    Return ONLY valid JSON."""
)

# Content Generation Agent will be created dynamically with MCP tools
ContentGenerationAgent = None

def get_mcp_token():
    """Get OAuth token for MCP Gateway"""
    # Check if MCP is disabled (for public demo mode)
    if os.getenv("DISABLE_MCP", "false").lower() == "true":
        print("⚠️ MCP is disabled - running in demo mode with placeholder content")
        return None
    
    try:
        from mcp_utils import load_mcp_config, get_oauth_token
        config = load_mcp_config()
        if config:
            return get_oauth_token(config["client_info"])
    except Exception as e:
        print(f"❌ Error getting MCP token: {e}")
    return None

def create_streamable_http_transport():
    """Create streamable HTTP transport with AWS SigV4 authentication"""
    # Check if MCP is disabled (for public demo mode)
    if os.getenv("DISABLE_MCP", "false").lower() == "true":
        print("⚠️ MCP transport disabled - demo mode active")
        return None
    
    try:
        from mcp.client.streamable_http import streamablehttp_client
        import boto3
        from botocore.auth import SigV4Auth
        from botocore.awsrequest import AWSRequest
        
        # Use hardcoded gateway URL
        gateway_url = "https://real-mcp-marketing-gateway-cfc6b1d0-6mdqt3b1cg.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp"
        
        # Get AWS credentials from boto3 session
        session = boto3.Session()
        credentials = session.get_credentials()
        
        if credentials:
            # Create AWS SigV4 signed headers
            request = AWSRequest(method='POST', url=gateway_url)
            SigV4Auth(credentials, 'bedrock-agentcore', 'us-east-1').add_auth(request)
            
            print(f"✅ Using AWS SigV4 auth for MCP gateway")
            return streamablehttp_client(gateway_url, headers=dict(request.headers))
        else:
            print("❌ No AWS credentials found")
            return None
    except Exception as e:
        print(f"❌ Error creating MCP transport: {e}")
        import traceback
        traceback.print_exc()
    return None

def invoke_content_generation_with_mcp(prompt: str) -> dict:
    """
    Invoke content generation using MCP tools following the correct with client: pattern
    """
    try:
        # Create MCP client
        client = MCPClient(create_streamable_http_transport)
        
        # Use the client within context manager - CORRECT PATTERN
        with client:
            # Get tools from MCP client
            tools = client.list_tools_sync()
            print(f"✅ Loaded {len(tools)} MCP tools for content generation")
            
            # Create agent with model and tools WITHIN the context
            agent = Agent(
                model=model, 
                tools=tools,
                system_prompt=f"""You are a marketing content generator using Real MCP Marketing Gateway tools.

                Available MCP Tools:
                - real-marketing-tools___generate_image_nova: Amazon Nova Canvas (premium image generation)
                - real-marketing-tools___generate_video: Amazon Nova Reel (6-second video generation)
                - real-marketing-tools___check_video_job_status: Check video generation status
                - real-marketing-tools___generate_image: Stability AI (deprecated - use Nova instead)
                
                For each ad prompt provided:
                
                1. **text_ad**: Write compelling marketing copy (no tools needed)
                   - Create engaging, persuasive text
                   - Include clear call-to-action
                   - Match the audience and platform style
                
                2. **image_ad**: Use real-marketing-tools___generate_image_nova for professional marketing images
                   - Call: real-marketing-tools___generate_image_nova
                   - Parameters: prompt (required), width=1024, height=1024, quality="premium"
                   - Use the exact prompt provided, enhanced for visual appeal
                   - The tool returns S3 URL - use this as the content
                
                3. **video_ad**: Use real-marketing-tools___generate_video for marketing videos
                   - Step 1: Call real-marketing-tools___generate_video
                     * Parameters: prompt (required), duration=6, width=1280, height=720, max_wait_seconds=120
                     * Use the exact prompt provided, enhanced for video content
                     * This returns an invocation ARN for tracking
                   
                   - Step 2: Wait for video completion using real-marketing-tools___check_video_job_status
                     * Call real-marketing-tools___check_video_job_status with the invocation ARN
                     * Keep checking until status is "COMPLETED" or "FAILED"
                     * Wait 10-15 seconds between checks
                     * Maximum 10 attempts (about 2 minutes total)
                   
                   - Step 3: Use the final S3 URL from the completed job
                     * When status is "COMPLETED", extract the S3 URL from the response
                     * Use this S3 URL as the "content" field
                     * The S3 URL will be in format: s3://agentcore-demo-172/video-outputs/[job_id]/output.mp4
                
                CRITICAL RULES:
                - NEVER use placeholder URLs for videos - always wait for actual generation
                - DO NOT return results until ALL videos are fully generated and have real S3 URLs
                - If video generation fails after all attempts, mark that ad as "failed" status
                - All generated content is automatically uploaded to S3 bucket: agentcore-demo-172
                - Use the returned S3 URLs as the "content" field for image_ad and video_ad
                - Only use placeholder URLs if MCP tools are completely unavailable:
                  * Images: https://via.placeholder.com/1024x1024/667eea/ffffff?text=Marketing+Image
                  * Videos: https://via.placeholder.com/1280x720/764ba2/ffffff?text=Marketing+Video
                - Create unique asset_ids like "ad_001", "ad_002", etc.
                - Set status to "generated" only when content is actually ready
                - Generate content for ALL prompts provided
                
                Output JSON:
                {json.dumps(ContentGeneration.model_json_schema(), indent=2)}
                Return ONLY valid JSON."""
            )
            
            # Invoke the agent - ALL WITHIN THE CONTEXT
            print(f"🤖 Invoking content generation agent...")
            result = agent(prompt)
            
            return {
                "success": True,
                "result": result,
                "tools_count": len(tools)
            }
            
    except Exception as e:
        print(f"❌ Error invoking MCP content generation: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def create_content_generation_agent():
    """Create Content Generation Agent - now returns a wrapper function"""
    global ContentGenerationAgent
    
    # Always create a fresh agent to ensure MCP is used
    if True:  # Changed from 'if ContentGenerationAgent is None:' to always recreate
        # Create a wrapper function that uses MCP correctly
        def content_agent_wrapper(prompt):
            """Wrapper that invokes MCP agent correctly"""
            result = invoke_content_generation_with_mcp(prompt)
            if result["success"]:
                return result["result"]
            else:
                # Fallback to basic agent
                print("⚠️ MCP failed, using fallback agent")
                fallback_agent = Agent(
                    model=model,
                    tools=[generate_image],
                    system_prompt=f"""You are a marketing content generator. Generate marketing content for the provided prompts.

                    For each prompt, create ads with these rules:
                    
                    1. **text_ad**: Write compelling marketing copy (no URL needed)
                    2. **image_ad**: Use placeholder URL: https://via.placeholder.com/1024x1024/4A90E2/ffffff?text=Marketing+Image
                    3. **video_ad**: Use placeholder URL: https://via.placeholder.com/1280x720/E94B3C/ffffff?text=Marketing+Video
                    
                    CRITICAL RULES:
                    - Create unique asset_ids like "ad_001", "ad_002", etc.
                    - Set status to "generated" for all ads
                    - NEVER create fake S3 URLs
                    - Only use working placeholder URLs from via.placeholder.com
                    - Generate content for ALL prompts provided
                    - Include audience, platform, and ad_type for each ad
                    
                    Output JSON format:
                    {{
                      "ads": [
                        {{
                          "asset_id": "ad_001",
                          "audience": "Target Audience Name",
                          "platform": "Platform Name", 
                          "ad_type": "text_ad|image_ad|video_ad",
                          "content": "Ad content or placeholder URL",
                          "status": "generated"
                        }}
                      ]
                    }}
                    
                    Return ONLY valid JSON."""
                )
                return fallback_agent(prompt)
        
        ContentGenerationAgent = content_agent_wrapper
    
    return ContentGenerationAgent

# Content Revision Agent will be created dynamically with MCP tools
ContentRevisionAgent = None

def invoke_content_revision_with_mcp(prompt: str) -> dict:
    """
    Invoke content revision using MCP tools following the correct with client: pattern
    """
    try:
        # Create MCP client
        client = MCPClient(create_streamable_http_transport)
        
        # Use the client within context manager - CORRECT PATTERN
        with client:
            # Get tools from MCP client
            tools = client.list_tools_sync()
            print(f"✅ Loaded {len(tools)} MCP tools for content revision")
            
            # Create agent with model and tools WITHIN the context
            agent = Agent(
                model=model, 
                tools=tools,
                system_prompt=f"""You are an expert marketing content revision specialist using Real MCP Marketing Gateway tools.

                Available MCP Tools:
                - real-marketing-tools___generate_image_nova: Amazon Nova Canvas (premium image generation)
                - real-marketing-tools___generate_video: Amazon Nova Reel (6-second video generation)
                - real-marketing-tools___check_video_job_status: Check video generation status
                - real-marketing-tools___generate_image: Stability AI (deprecated - use Nova instead)
                
                Your expertise includes:
                1. **Content Analysis**: Evaluate feedback and identify improvement areas
                2. **Creative Strategy**: Develop enhanced creative approaches
                3. **Brand Consistency**: Maintain brand standards while improving performance
                4. **Performance Optimization**: Enhance content for better engagement and conversion
                5. **A/B Testing**: Create variations for testing different approaches
                
                Content Revision Process:
                1. **Analyze Feedback**: Understand specific issues and improvement requests
                2. **Identify Root Causes**: Determine why original content needs revision
                3. **Develop Strategy**: Create revision approach addressing all concerns
                4. **Generate Content**: Use appropriate MCP tools for enhanced content
                5. **Quality Assurance**: Ensure revisions exceed original quality
                
                Revision Guidelines by Content Type:
                
                1. **text_ad revision**: 
                   - Analyze feedback for tone, messaging, or CTA improvements
                   - Rewrite copy incorporating user feedback while maintaining persuasive power
                   - Enhance emotional appeal and value proposition clarity
                   - Optimize for platform-specific best practices
                   - Improve call-to-action effectiveness
                
                2. **image_ad revision**: 
                   - Use real-marketing-tools___generate_image_nova with enhanced prompts
                   - Incorporate visual feedback into detailed prompt modifications
                   - Consider composition, color psychology, and brand alignment
                   - Optimize for platform specifications and audience preferences
                   - Use returned S3 URL as new content
                
                3. **video_ad revision**: 
                   - Step 1: Use real-marketing-tools___generate_video with improved concepts
                     * Adapt video narrative and visual elements based on feedback
                     * Enhance storytelling and emotional engagement
                     * Parameters: prompt (required), duration=6, width=1280, height=720, max_wait_seconds=120
                   
                   - Step 2: Wait for completion using real-marketing-tools___check_video_job_status
                     * Use the invocation ARN from step 1
                     * Keep checking until status is "COMPLETED" or "FAILED"
                     * Wait 10-15 seconds between checks, maximum 10 attempts
                   
                   - Step 3: Use the final S3 URL from completed job as new content
                     * NEVER use placeholder URLs for video revisions
                     * Always wait for actual video generation to complete
                
                Quality Standards:
                - Address ALL feedback points comprehensively
                - Improve upon original content performance potential
                - Maintain audience targeting accuracy
                - Ensure platform-appropriate formatting and style
                - Optimize for engagement metrics and conversion goals
                
                CRITICAL REQUIREMENTS:
                - Keep the same asset_id for each revised ad
                - Update content based on comprehensive feedback analysis
                - Set status to "revised"
                - NEVER use placeholder URLs - always wait for real content generation
                - For videos: MUST wait for completion using check_video_job_status
                - Use only real S3 URLs returned by MCP tools as the new content
                - If generation fails, mark status as "failed" instead of using placeholders
                - Provide detailed explanation of changes made
                - Include rationale for improvement approach
                
                Output JSON format:
                {json.dumps(ContentGeneration.model_json_schema(), indent=2)}
                
                Return ONLY valid JSON with enhanced content and detailed revision notes."""
            )
            
            # Invoke the agent - ALL WITHIN THE CONTEXT
            print(f"🤖 Invoking content revision agent...")
            result = agent(prompt)
            
            return {
                "success": True,
                "result": result,
                "tools_count": len(tools)
            }
            
    except Exception as e:
        print(f"❌ Error invoking MCP content revision: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def create_content_revision_agent():
    """Create Content Revision Agent - now returns a wrapper function"""
    global ContentRevisionAgent
    
    if ContentRevisionAgent is None:
        # Create a wrapper function that uses MCP correctly
        def revision_agent_wrapper(prompt):
            """Wrapper that invokes MCP revision agent correctly"""
            result = invoke_content_revision_with_mcp(prompt)
            if result["success"]:
                return result["result"]
            else:
                # Fallback to basic agent
                print("⚠️ MCP failed, using fallback revision agent")
                fallback_agent = Agent(
                    model=model,
                    tools=[generate_image],
                    system_prompt=f"""You revise marketing content based on user feedback using basic tools.
                    
                    Revise content as requested. For image and video ads, create descriptive text 
                    explaining what would be generated since MCP tools are not available.
                    
                    Output JSON:
                    {json.dumps(ContentGeneration.model_json_schema(), indent=2)}
                    Return ONLY valid JSON."""
                )
                return fallback_agent(prompt)
        
        ContentRevisionAgent = revision_agent_wrapper
    
    return ContentRevisionAgent

AnalyticsAgent = Agent(
    model=model,
    system_prompt=f"""You are an expert marketing analytics specialist analyzing campaign performance data.
    
    Your role is to:
    1. Analyze performance metrics for each audience-platform combination
    2. Calculate key performance indicators (KPIs)
    3. Identify trends and patterns in the data
    4. Provide actionable insights for optimization
    
    For each audience-platform combination, calculate:
    1. Revenue = conversions * product_cost 
    2. Return on Investment (ROI) = ((Revenue - Cost) / Cost) * 100
    3. Click Through Rate (CTR) = (Clicks / Impressions) * 100
    4. Conversion Rate = (Conversions / Clicks) * 100
    5. Cost Per Click (CPC) = Cost / Clicks
    6. Cost Per Acquisition (CPA) = Cost / Conversions
    7. Redirect Rate = (Redirects / Clicks) * 100
    
    Analysis Guidelines:
    - Identify best and worst performing platform-audience combinations based on ROI
    - Flag any anomalies or concerning trends
    - Provide specific recommendations for improvement
    - Consider seasonal factors and market conditions
    - Analyze audience engagement patterns
    
    Output JSON format:
    {json.dumps(PerformanceAnalysis.model_json_schema(), indent=2)}
    
    Return ONLY valid JSON with comprehensive analysis and insights."""
)

OptimizationAgent = Agent(
    model=model,
    system_prompt=f"""You are an expert marketing optimization strategist specializing in budget allocation and campaign performance improvement.
    
    Your role is to:
    1. Analyze performance data to identify optimization opportunities
    2. Recommend budget reallocation strategies
    3. Suggest creative and targeting improvements
    4. Provide data-driven recommendations for campaign enhancement
    
    Budget Optimization Strategy:
    - Shift budget FROM low ROI TO high ROI platforms within same audience
    - Consider audience-platform fit and engagement patterns
    - Maintain total budget constraints
    - Account for minimum viable spend thresholds
    - Consider seasonal and market timing factors
    
    Optimization Areas:
    1. Budget Reallocation: Move spend to better-performing platforms
    2. Audience Refinement: Suggest audience targeting improvements
    3. Creative Optimization: Recommend content improvements
    4. Bidding Strategy: Suggest bid adjustments
    5. Timing Optimization: Recommend schedule changes
    
    For each optimization recommendation, provide:
    - Clear rationale based on performance data
    - Expected impact on key metrics
    - Implementation priority (High/Medium/Low)
    - Risk assessment and mitigation strategies
    
    For budget changes, specify:
    - audience: audience name
    - platform: platform name
    - old_amount: current budget
    - new_amount: optimized budget
    - change: difference (positive = increase, negative = decrease)
    - reason: data-driven justification
    
    Output JSON format:
    {json.dumps(OptimizationDecision.model_json_schema(), indent=2)}
    
    Return ONLY valid JSON with comprehensive optimization recommendations."""
)

# -----------------------------
# Advanced Campaign Management Functions
# -----------------------------

def comprehensive_campaign_analysis(campaign_data: dict, performance_data: dict) -> dict:
    """
    Perform comprehensive campaign analysis using Analytics and Optimization agents
    """
    try:
        print("📊 Starting comprehensive campaign analysis...")
        
        # Step 1: Analytics Agent Analysis
        print("📈 Running performance analytics...")
        analytics_input = f"""
        Campaign Data:
        {json.dumps(campaign_data, indent=2)}
        
        Performance Data:
        {json.dumps(performance_data, indent=2)}
        
        Analyze the campaign performance and provide detailed insights.
        """
        
        analytics_response = AnalyticsAgent(analytics_input)
        analytics_data = parse_json_response(analytics_response)
        
        # Step 2: Optimization Agent Recommendations
        print("🎯 Generating optimization recommendations...")
        optimization_input = f"""
        Campaign Data:
        {json.dumps(campaign_data, indent=2)}
        
        Performance Analysis:
        {json.dumps(analytics_data, indent=2)}
        
        Based on the performance analysis, provide optimization recommendations.
        """
        
        optimization_response = OptimizationAgent(optimization_input)
        optimization_data = parse_json_response(optimization_response)
        
        return {
            "status": "completed",
            "analytics": analytics_data,
            "optimization": optimization_data,
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_performance_metrics": len(performance_data.get("metrics", [])),
                "optimization_recommendations": len(optimization_data.get("recommendations", [])),
                "key_insights": analytics_data.get("key_insights", []),
                "priority_actions": optimization_data.get("priority_actions", [])
            }
        }
        
    except Exception as e:
        print(f"❌ Error in comprehensive analysis: {e}")
        return {
            "status": "error",
            "error": str(e),
            "analytics": None,
            "optimization": None
        }

def advanced_content_revision_workflow(content_data: dict, feedback: dict, revision_type: str = "comprehensive") -> dict:
    """
    Advanced content revision workflow with multiple revision strategies
    """
    try:
        print(f"🔄 Starting {revision_type} content revision workflow...")
        
        # Prepare comprehensive revision input
        revision_input = f"""
        Original Content Data:
        {json.dumps(content_data, indent=2)}
        
        User Feedback:
        {json.dumps(feedback, indent=2)}
        
        Revision Type: {revision_type}
        
        Revision Instructions:
        1. Analyze all feedback points thoroughly
        2. Identify content performance issues
        3. Develop strategic improvements for each asset
        4. Generate enhanced content using MCP tools
        5. Provide A/B testing recommendations
        
        Focus Areas:
        - Creative effectiveness and engagement
        - Brand consistency and messaging clarity
        - Platform optimization and best practices
        - Conversion optimization and CTA improvement
        - Audience targeting and personalization
        
        Please revise the content comprehensively based on this feedback.
        """
        
        # Execute content revision
        agent = create_content_revision_agent()
        revision_response = agent(revision_input)
        revision_data = parse_json_response(revision_response)
        
        return {
            "status": "completed",
            "revision_type": revision_type,
            "original_content": content_data,
            "feedback_applied": feedback,
            "revised_content": revision_data,
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "assets_revised": len(revision_data.get("ads", [])),
                "revision_approach": revision_data.get("revision_summary", {}).get("revision_approach", "Standard"),
                "key_improvements": revision_data.get("revision_summary", {}).get("key_improvements", []),
                "expected_impact": revision_data.get("revision_summary", {}).get("expected_impact", "Improved performance expected")
            }
        }
        
    except Exception as e:
        print(f"❌ Error in content revision workflow: {e}")
        return {
            "status": "error",
            "error": str(e),
            "revised_content": None
        }

def campaign_performance_monitoring(session_id: str, campaign_data: dict) -> dict:
    """
    Continuous campaign performance monitoring and alerting
    """
    try:
        print(f"📡 Monitoring campaign performance for session: {session_id}")
        
        # Generate realistic performance data for monitoring
        performance_data = create_sample_performance(
            campaign_data.get("ads", []), 
            campaign_data.get("product_cost", 89.99)
        )
        
        # Analyze performance trends
        analytics_input = f"""
        Campaign Session: {session_id}
        
        Current Performance Data:
        {json.dumps(performance_data, indent=2)}
        
        Campaign Configuration:
        {json.dumps(campaign_data, indent=2)}
        
        Provide real-time performance analysis with:
        1. Current performance status
        2. Trend analysis
        3. Alert conditions (if any)
        4. Immediate action recommendations
        5. Performance forecasting
        """
        
        analytics_response = AnalyticsAgent(analytics_input)
        analytics_data = parse_json_response(analytics_response)
        
        # Check for optimization opportunities
        if analytics_data.get("performance_score", 0) < 70:  # Performance threshold
            optimization_input = f"""
            Performance Alert: Campaign performance below threshold
            
            Analytics Results:
            {json.dumps(analytics_data, indent=2)}
            
            Provide immediate optimization recommendations to improve performance.
            """
            
            optimization_response = OptimizationAgent(optimization_input)
            optimization_data = parse_json_response(optimization_response)
        else:
            optimization_data = {"status": "performance_acceptable", "recommendations": []}
        
        return {
            "session_id": session_id,
            "monitoring_status": "active",
            "performance_data": performance_data,
            "analytics": analytics_data,
            "optimization": optimization_data,
            "timestamp": datetime.now().isoformat(),
            "alerts": analytics_data.get("alerts", []),
            "next_check": (datetime.now() + timedelta(hours=1)).isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error in performance monitoring: {e}")
        return {
            "session_id": session_id,
            "monitoring_status": "error",
            "error": str(e)
        }

# -----------------------------
# Helper Functions
# -----------------------------

def parse_json_response(response):
    """Extract and parse JSON from agent response"""
    content = response.message["content"][0]["text"]
    
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    
    return json.loads(content)

def create_sample_performance(ads: List[GeneratedAd], product_cost: float) -> List[Dict]:
    """Create sample performance data with all metrics"""
    import random
    
    performance = []
    for ad in ads:
        base = 1.0
        if ad.platform in ["Instagram", "TikTok"] and ad.ad_type in ["image_ad", "video_ad"]:
            base = 1.5
        elif ad.platform == "LinkedIn":
            base = 1.2
        elif ad.platform == "Facebook":
            base = 0.9
        
        impressions = int(random.randint(5000, 20000) * base)
        clicks = int(impressions * random.uniform(0.01, 0.05) * base)
        redirects = int(clicks * random.uniform(0.3, 0.7))
        conversions = int(redirects * random.uniform(0.05, 0.20) * base)
        likes = int(impressions * random.uniform(0.001, 0.01))
        cost = random.uniform(50, 300)
        revenue = conversions * product_cost
        roi = ((revenue - cost) / cost * 100) if cost > 0 else 0
        
        performance.append({
            "asset_id": ad.asset_id,
            "impressions": impressions,
            "clicks": clicks,
            "redirects": redirects,
            "conversions": conversions,
            "likes": likes,
            "cost": round(cost, 2),
            "revenue": round(revenue, 2),
            "roi": round(roi, 2)
        })
    
    return performance

def upload_to_s3(file_path: str) -> str:
    """Upload file to S3 and return the S3 URL"""
    try:
        bucket_name = "agentcore-demo-172"
        s3_client = boto3.client('s3')
        
        # Generate unique filename with timestamp
        import time
        timestamp = int(time.time())
        filename = f"image-outputs/{timestamp}_{os.path.basename(file_path)}"
        
        # Upload file
        s3_client.upload_file(file_path, bucket_name, filename)
        
        # Return S3 URI
        s3_uri = f"s3://{bucket_name}/{filename}"
        return s3_uri
        
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return file_path  # Return original path if upload fails

def format_content_for_display(content_data: dict) -> str:
    """Format generated content for user display"""
    display = "\n🎨 GENERATED CONTENT:\n" + "="*60 + "\n"
    
    for i, ad in enumerate(content_data.get("ads", []), 1):
        display += f"\n📄 Ad {i} - {ad['asset_id']}\n"
        display += f"   Audience: {ad['audience']}\n"
        display += f"   Platform: {ad['platform']}\n"
        display += f"   Type: {ad['ad_type']}\n"
        display += f"   Status: {ad['status']}\n"
        
        if ad['ad_type'] == "text_ad":
            display += f"   Content: {ad['content'][:100]}...\n"
        else:
            display += f"   File: {ad['content']}\n"
        display += "-" * 40 + "\n"
    
    return display

# -----------------------------
# Individual Agent Entrypoints
# -----------------------------

@app.entrypoint
def audience_analysis(payload):
    """Audience Analysis Agent - Identifies target audiences"""
    try:
        product = payload.get("product")
        if not product:
            return {"error": "Product description required"}
        
        print(f"🎯 Audience Agent: Analyzing target audiences for {product}")
        response = AudienceAgent(f"Product: {product}\n\nIdentify 3 target audiences with their best 2-3 platforms.")
        result = parse_json_response(response)
        
        return {
            "agent": "AudienceAgent",
            "status": "completed",
            "result": result
        }
    except Exception as e:
        return {"agent": "AudienceAgent", "error": str(e)}

@app.entrypoint
def budget_allocation(payload):
    """Budget Allocation Agent - Allocates budget across audiences and platforms"""
    try:
        product = payload.get("product")
        budget = payload.get("budget")
        audiences = payload.get("audiences")
        
        if not all([product, budget, audiences]):
            return {"error": "Product, budget, and audiences required"}
        
        print(f"💰 Budget Agent: Allocating ${budget} budget")
        budget_input = f"Product: {product}\nTotal Budget: ${budget}\n\nAudiences:\n{json.dumps(audiences)}\n\nAllocate budget across audiences and platforms."
        response = BudgetAgent(budget_input)
        result = parse_json_response(response)
        
        return {
            "agent": "BudgetAgent",
            "status": "completed",
            "result": result
        }
    except Exception as e:
        return {"agent": "BudgetAgent", "error": str(e)}

@app.entrypoint
def prompt_strategy(payload):
    """Prompt Strategy Agent - Creates ad prompts"""
    try:
        product = payload.get("product")
        audiences = payload.get("audiences")
        budget_data = payload.get("budget_data")
        
        if not all([product, audiences, budget_data]):
            return {"error": "Product, audiences, and budget_data required"}
        
        print("✍️ Prompt Agent: Creating ad prompts")
        prompt_input = f"Product: {product}\n\nAudiences:\n{json.dumps(audiences)}\n\nBudget:\n{json.dumps(budget_data)}\n\nCreate 2 ad prompts per platform."
        response = PromptAgent(prompt_input)
        result = parse_json_response(response)
        
        return {
            "agent": "PromptAgent",
            "status": "completed",
            "result": result
        }
    except Exception as e:
        return {"agent": "PromptAgent", "error": str(e)}

@app.entrypoint
def content_generation(payload):
    """Content Generation Agent - Generates ad content and uploads images to S3"""
    try:
        product = payload.get("product")
        prompts = payload.get("prompts")
        
        if not all([product, prompts]):
            return {"error": "Product and prompts required"}
        
        print("🎨 Content Agent: Generating ad content")
        
        content_input = f"Product: {product}\n\nPrompts:\n{json.dumps(prompts)}\n\nGenerate content for each prompt."
        agent = create_content_generation_agent()
        response = agent(content_input)
        result = parse_json_response(response)
        
        # Upload generated images to S3 and update URLs
        if "ads" in result:
            for ad in result["ads"]:
                if ad.get("ad_type") == "image_ad" and ad.get("content"):
                    # Check if content is a local file path
                    if ad["content"].startswith("output/") or ad["content"].endswith((".png", ".jpg", ".jpeg")):
                        print(f"📤 Uploading {ad['content']} to S3...")
                        s3_uri = upload_to_s3(ad["content"])
                        ad["content"] = s3_uri
                        print(f"✅ Uploaded to: {s3_uri}")
        
        return {
            "agent": "ContentGenerationAgent",
            "status": "completed",
            "result": result,
            "display": format_content_for_display(result)
        }
    except Exception as e:
        return {"agent": "ContentGenerationAgent", "error": str(e)}

@app.entrypoint
def content_revision(payload):
    """Content Revision Agent - Revises content and uploads images to S3"""
    try:
        current_content = payload.get("current_content")
        feedback = payload.get("feedback")
        
        if not all([current_content, feedback]):
            return {"error": "Current content and feedback required"}
        
        print(f"🔄 Revision Agent: Revising content based on feedback")
        
        revision_input = f"""Current Content:
{json.dumps(current_content, indent=2)}

User Feedback: {feedback}

Please revise the content based on the user's feedback."""
        
        agent = create_content_revision_agent()
        response = agent(revision_input)
        result = parse_json_response(response)
        
        # Upload generated images to S3 and update URLs
        if "ads" in result:
            for ad in result["ads"]:
                if ad.get("ad_type") == "image_ad" and ad.get("content"):
                    # Check if content is a local file path
                    if ad["content"].startswith("output/") or ad["content"].endswith((".png", ".jpg", ".jpeg")):
                        print(f"📤 Uploading revised {ad['content']} to S3...")
                        s3_uri = upload_to_s3(ad["content"])
                        ad["content"] = s3_uri
                        print(f"✅ Uploaded to: {s3_uri}")
        
        return {
            "agent": "ContentRevisionAgent",
            "status": "completed",
            "result": result,
            "display": format_content_for_display(result)
        }
    except Exception as e:
        return {"agent": "ContentRevisionAgent", "error": str(e)}

@app.entrypoint
def analytics(payload):
    """Analytics Agent - Analyzes campaign performance"""
    try:
        performance = payload.get("performance")
        product_cost = payload.get("product_cost")
        
        if not all([performance, product_cost]):
            return {"error": "Performance data and product_cost required"}
        
        print("📊 Analytics Agent: Analyzing performance")
        analytics_input = f"Performance: {json.dumps(performance)}\nProduct Cost: {product_cost}"
        response = AnalyticsAgent(analytics_input)
        result = parse_json_response(response)
        
        return {
            "agent": "AnalyticsAgent",
            "status": "completed",
            "result": result
        }
    except Exception as e:
        return {"agent": "AnalyticsAgent", "error": str(e)}

@app.entrypoint
def optimization(payload):
    """Optimization Agent - Optimizes budget allocation"""
    try:
        budget_allocation = payload.get("budget_allocation")
        analytics_data = payload.get("analytics_data")
        
        if not all([budget_allocation, analytics_data]):
            return {"error": "Budget allocation and analytics data required"}
        
        print("🔄 Optimization Agent: Optimizing budget")
        opt_input = f"Budget: {json.dumps(budget_allocation)}\nAnalytics: {json.dumps(analytics_data)}"
        response = OptimizationAgent(opt_input)
        result = parse_json_response(response)
        
        return {
            "agent": "OptimizationAgent",
            "status": "completed",
            "result": result
        }
    except Exception as e:
        return {"agent": "OptimizationAgent", "error": str(e)}

# -----------------------------
# Campaign Orchestrator
# -----------------------------

def parse_malformed_json(text):
    """Parse malformed JSON that's missing quotes around keys and values"""
    text = text.strip()
    if text.startswith('{') and text.endswith('}'):
        text = text[1:-1]  # Remove outer braces
    
    result = {}
    import re
    
    # Strategy: Find all key: patterns, then extract value until next key: or end
    # Pattern to find keys (word followed by colon)
    key_positions = [(m.start(), m.group(1)) for m in re.finditer(r'(\w+):', text)]
    
    for i, (pos, key) in enumerate(key_positions):
        # Find where the value starts (after the colon)
        value_start = pos + len(key) + 1
        
        # Find where the value ends (at next key or end of string)
        if i < len(key_positions) - 1:
            value_end = key_positions[i + 1][0] - 1  # -1 to remove the comma
        else:
            value_end = len(text)
        
        # Extract and clean the value
        value = text[value_start:value_end].strip().rstrip(',')
        result[key] = value
    
    return result


@app.entrypoint
def campaign_orchestrator(payload):
    """
    Campaign Orchestrator - Coordinates all agents in the marketing campaign
    
    Payload formats:
    1. Start new campaign:
    {
        "action": "start_campaign",
        "product": "Your product description",
        "product_cost": 45.99,
        "budget": 5000.0
    }
    
    2. Provide feedback:
    {
        "action": "provide_feedback",
        "session_id": "session-123",
        "feedback_type": "approve" or "revise",
        "feedback": "Optional feedback for revisions"
    }
    """
    try:
        # Handle BedrockAgentCoreApp's payload wrapping
        if isinstance(payload, dict) and 'prompt' in payload:
            # Extract the prompt string
            prompt_str = payload['prompt']
            
            # Try to parse as proper JSON first
            try:
                payload = json.loads(prompt_str)
            except json.JSONDecodeError:
                # Parse malformed JSON (without quotes)
                payload = parse_malformed_json(prompt_str)
                    
        elif isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                payload = parse_malformed_json(payload)
        
        # Add debug logging
        print(f"DEBUG: Processed payload: {payload}")
        print(f"DEBUG: Payload type: {type(payload)}")
        
        action = payload.get("action")
        print(f"DEBUG: Action extracted: {action}")
        
        if not action:
            return {
                "orchestrator": "CampaignOrchestrator",
                "error": f"Invalid action: {action}. Use 'start_campaign', 'provide_feedback', 'monitor_campaign', or 'advanced_revision'",
                "debug_payload": str(payload),
                "debug_keys": list(payload.keys()) if isinstance(payload, dict) else "not a dict",
                "available_actions": [
                    "start_campaign - Start a new marketing campaign",
                    "provide_feedback - Approve or revise campaign content", 
                    "monitor_campaign - Monitor campaign performance in real-time",
                    "advanced_revision - Advanced content revision with multiple strategies"
                ]
            }
        
        if action == "start_campaign":
            product = payload.get("product")
            product_cost = payload.get("product_cost")
            budget = payload.get("budget")
            
            # Convert to float if they're strings
            if product_cost:
                product_cost = float(product_cost)
            if budget:
                budget = float(budget)
            
            if not all([product, product_cost, budget]):
                return {
                    "error": "Missing required fields: product, product_cost, budget",
                    "orchestrator": "CampaignOrchestrator",
                    "received": {
                        "product": product,
                        "product_cost": product_cost,
                        "budget": budget
                    }
                }            

            # Create a unique session ID
            session_id = f"session-{str(uuid.uuid4())[:8]}"
            
            print(f"\n🎯 Orchestrator: Starting campaign for session: {session_id}")
            
            # Step 1: Get audiences from AudienceAgent
            print("📞 Orchestrator: Calling Audience Agent...")
            aud_response = AudienceAgent(f"Product: {product}\n\nIdentify 3 target audiences with their best 2-3 platforms.")
            aud_data = parse_json_response(aud_response)
            print(f"✅ Orchestrator: Received audience analysis")
            
            # Step 2: Get budget allocation
            print("📞 Orchestrator: Calling Budget Agent...")
            budget_input = f"Product: {product}\nTotal Budget: ${budget}\n\nAudiences:\n{json.dumps(aud_data)}\n\nAllocate budget across audiences and platforms."
            budget_response = BudgetAgent(budget_input)
            budget_data = parse_json_response(budget_response)
            print(f"✅ Orchestrator: Received budget allocation")
            
            # Step 3: Get prompts
            print("📞 Orchestrator: Calling Prompt Agent...")
            prompt_input = f"Product: {product}\n\nAudiences:\n{json.dumps(aud_data)}\n\nBudget:\n{json.dumps(budget_data)}\n\nCreate 2 ad prompts per platform."
            prompt_response = PromptAgent(prompt_input)
            prompt_data = parse_json_response(prompt_response)
            print(f"✅ Orchestrator: Received prompt strategy")
            
            # Step 4: Generate content and upload images to S3
            print("📞 Orchestrator: Calling Content Generation Agent...")
            content_input = f"Product: {product}\n\nPrompts:\n{json.dumps(prompt_data)}\n\nGenerate content for each prompt."
            agent = create_content_generation_agent()
            content_response = agent(content_input)
            content_data = parse_json_response(content_response)
            
            # Upload generated images to S3 and update URLs
            if "ads" in content_data:
                for ad in content_data["ads"]:
                    if ad.get("ad_type") == "image_ad" and ad.get("content"):
                        # Check if content is a local file path
                        if ad["content"].startswith("output/") or ad["content"].endswith((".png", ".jpg", ".jpeg")):
                            print(f"📤 Uploading {ad['content']} to S3...")
                            s3_uri = upload_to_s3(ad["content"])
                            ad["content"] = s3_uri
                            print(f"✅ Uploaded to: {s3_uri}")
            
            print(f"✅ Orchestrator: Received generated content with S3 URIs")
            
            # Store session state
            SESSION_STATE[session_id] = {
                "stage": "content_review",
                "product": product,
                "product_cost": product_cost,
                "budget": budget,
                "audiences": aud_data,
                "budget_allocation": budget_data,
                "prompts": prompt_data,
                "content": content_data
            }
            
            return {
                "orchestrator": "CampaignOrchestrator",
                "stage": "content_review",
                "session_id": session_id,
                "message": "Campaign orchestrated successfully! Content generated by multiple agents.",
                "agent_flow": [
                    "AudienceAgent → audience analysis ✅",
                    "BudgetAgent → budget allocation ✅", 
                    "PromptAgent → ad prompts ✅",
                    "ContentGenerationAgent → ad content ✅"
                ],
                "content_display": format_content_for_display(content_data),
                "instructions": "Use 'provide_feedback' action to continue"
            }
            
        elif action == "monitor_campaign":
            session_id = payload.get("session_id")
            
            if session_id not in SESSION_STATE:
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "error": "Session not found. Please start a new campaign.",
                    "stage": "error"
                }
            
            state = SESSION_STATE[session_id]
            
            # Run performance monitoring
            campaign_data = {
                "session_id": session_id,
                "product": state["product"],
                "product_cost": state["product_cost"],
                "budget": state["budget"],
                "audiences": state["audiences"],
                "budget_allocation": state["budget_allocation"],
                "content": state["content"]
            }
            
            monitoring_result = campaign_performance_monitoring(session_id, campaign_data)
            
            return {
                "orchestrator": "CampaignOrchestrator",
                "action": "monitor_campaign",
                "session_id": session_id,
                "monitoring_result": monitoring_result,
                "stage": state.get("stage", "unknown"),
                "message": "Campaign monitoring completed"
            }
            
        elif action == "advanced_revision":
            session_id = payload.get("session_id")
            feedback = payload.get("feedback", {})
            revision_type = payload.get("revision_type", "comprehensive")
            
            if session_id not in SESSION_STATE:
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "error": "Session not found. Please start a new campaign.",
                    "stage": "error"
                }
            
            state = SESSION_STATE[session_id]
            
            # Run advanced content revision workflow
            revision_result = advanced_content_revision_workflow(
                state["content"], 
                feedback, 
                revision_type
            )
            
            if revision_result["status"] == "completed":
                # Update state with revised content
                state["content"] = revision_result["revised_content"]
                
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "action": "advanced_revision",
                    "session_id": session_id,
                    "stage": "content_review",
                    "message": f"Advanced {revision_type} revision completed successfully!",
                    "revision_result": revision_result,
                    "content_display": format_content_for_display(revision_result["revised_content"]),
                    "instructions": "Use 'provide_feedback' action to approve or request further revisions"
                }
            else:
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "error": f"Advanced revision failed: {revision_result.get('error', 'Unknown error')}",
                    "stage": "content_review"
                }
        
        elif action == "provide_feedback":
            session_id = payload.get("session_id")
            feedback_type = payload.get("feedback_type")
            feedback = payload.get("feedback")
            
            if session_id not in SESSION_STATE:
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "error": "Session not found. Please start a new campaign.",
                    "stage": "error"
                }
            
            state = SESSION_STATE[session_id]
            
            if state["stage"] != "content_review":
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "error": f"Invalid stage. Current stage: {state['stage']}",
                    "stage": state["stage"]
                }
            
            if feedback_type == "approve":
                print(f"\n✅ Orchestrator: Content approved for session {session_id}")
                print("📞 Orchestrator: Calling Analytics Agent...")
                
                # Create sample performance data
                content = ContentGeneration(**state["content"])
                performance = create_sample_performance(content.ads, state["product_cost"])
                
                # Organize performance by platform
                perf_by_platform = {}
                for perf in performance:
                    ad = next((a for a in content.ads if a.asset_id == perf["asset_id"]), None)
                    if not ad:
                        continue
                    
                    key = f"{ad.audience}|{ad.platform}"
                    if key not in perf_by_platform:
                        perf_by_platform[key] = {
                            "audience": ad.audience,
                            "platform": ad.platform,
                            "impressions": 0, "clicks": 0, "redirects": 0,
                            "conversions": 0, "likes": 0, "cost": 0, "revenues": []
                        }
                    
                    perf_by_platform[key]["impressions"] += perf["impressions"]
                    perf_by_platform[key]["clicks"] += perf["clicks"]
                    perf_by_platform[key]["redirects"] += perf["redirects"]
                    perf_by_platform[key]["conversions"] += perf["conversions"]
                    perf_by_platform[key]["likes"] += perf["likes"]
                    perf_by_platform[key]["cost"] += perf["cost"]
                    perf_by_platform[key]["revenues"].append(perf["revenue"])
                
                perf_summary = []
                for key, data in perf_by_platform.items():
                    perf_summary.append({
                        "audience": data["audience"],
                        "platform": data["platform"],
                        "impressions": data["impressions"],
                        "clicks": data["clicks"],
                        "redirects": data["redirects"],
                        "conversions": data["conversions"],
                        "likes": data["likes"],
                        "cost": round(data["cost"], 2),
                        "revenue": round(sum(data["revenues"]), 2)
                    })
                
                # Use comprehensive campaign analysis
                campaign_data = {
                    "session_id": session_id,
                    "product": state["product"],
                    "product_cost": state["product_cost"],
                    "budget": state["budget"],
                    "audiences": state["audiences"],
                    "budget_allocation": state["budget_allocation"],
                    "content": state["content"],
                    "ads": content.ads
                }
                
                performance_data = {
                    "metrics": perf_summary,
                    "summary": {
                        "total_impressions": sum(p["impressions"] for p in perf_summary),
                        "total_clicks": sum(p["clicks"] for p in perf_summary),
                        "total_conversions": sum(p["conversions"] for p in perf_summary),
                        "total_cost": sum(p["cost"] for p in perf_summary),
                        "total_revenue": sum(p["revenue"] for p in perf_summary)
                    }
                }
                
                # Run comprehensive analysis
                analysis_result = comprehensive_campaign_analysis(campaign_data, performance_data)
                
                if analysis_result["status"] == "completed":
                    analytics_data = analysis_result["analytics"]
                    opt_data = analysis_result["optimization"]
                    print(f"✅ Orchestrator: Completed comprehensive campaign analysis")
                    
                    # CRITICAL: Save analytics and optimization results to files immediately
                    try:
                        save_agent_result(session_id, "AnalyticsAgent", analytics_data, "analytics")
                        print(f"✅ Orchestrator: Saved analytics result to file")
                    except Exception as save_error:
                        print(f"⚠️ Orchestrator: Could not save analytics: {save_error}")
                    
                    try:
                        save_agent_result(session_id, "OptimizationAgent", opt_data, "optimization")
                        print(f"✅ Orchestrator: Saved optimization result to file")
                    except Exception as save_error:
                        print(f"⚠️ Orchestrator: Could not save optimization: {save_error}")
                else:
                    # Fallback to individual agents
                    analytics_input = f"Performance: {json.dumps(perf_summary)}\nProduct Cost: {state['product_cost']}"
                    analytics_response = AnalyticsAgent(analytics_input)
                    analytics_data = parse_json_response(analytics_response)
                    
                    opt_input = f"Budget: {json.dumps(state['budget_allocation'])}\nAnalytics: {json.dumps(analytics_data)}"
                    opt_response = OptimizationAgent(opt_input)
                    opt_data = parse_json_response(opt_response)
                    print(f"✅ Orchestrator: Completed fallback analysis")
                    
                    # CRITICAL: Save analytics and optimization results to files immediately
                    try:
                        save_agent_result(session_id, "AnalyticsAgent", analytics_data, "analytics")
                        print(f"✅ Orchestrator: Saved analytics result to file")
                    except Exception as save_error:
                        print(f"⚠️ Orchestrator: Could not save analytics: {save_error}")
                    
                    try:
                        save_agent_result(session_id, "OptimizationAgent", opt_data, "optimization")
                        print(f"✅ Orchestrator: Saved optimization result to file")
                    except Exception as save_error:
                        print(f"⚠️ Orchestrator: Could not save optimization: {save_error}")
                
                # Update state
                state["stage"] = "completed"
                state["performance"] = perf_summary
                state["analytics"] = analytics_data
                state["optimization"] = opt_data
                
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "stage": "completed",
                    "session_id": session_id,
                    "message": "Campaign completed successfully! All agents collaborated.",
                    "agent_flow": [
                        "AudienceAgent → audience analysis ✅",
                        "BudgetAgent → budget allocation ✅", 
                        "PromptAgent → ad prompts ✅",
                        "ContentGenerationAgent → ad content ✅",
                        "AnalyticsAgent → performance analysis ✅",
                        "OptimizationAgent → budget optimization ✅"
                    ],
                    "results": {
                        "product": state["product"],
                        "audiences": state["audiences"],
                        "budget_allocation": state["budget_allocation"],
                        "content": state["content"],
                        "performance": perf_summary,
                        "analytics": analytics_data,
                        "optimization": opt_data
                    }
                }
                
            elif feedback_type == "revise":
                if not feedback:
                    return {
                        "orchestrator": "CampaignOrchestrator",
                        "error": "Feedback is required for revision",
                        "stage": "content_review"
                    }
                
                print(f"📞 Orchestrator: Calling Advanced Content Revision Workflow...")
                
                # Use advanced revision workflow
                feedback_data = {
                    "type": "user_feedback",
                    "content": feedback,
                    "timestamp": datetime.now().isoformat(),
                    "revision_request": "standard"
                }
                
                revision_result = advanced_content_revision_workflow(
                    state["content"], 
                    feedback_data, 
                    "standard"
                )
                
                if revision_result["status"] == "completed":
                    revised_data = revision_result["revised_content"]
                    print(f"✅ Orchestrator: Advanced revision completed successfully")
                else:
                    # Fallback to basic revision
                    print(f"⚠️ Advanced revision failed, using fallback...")
                    revision_input = f"""Current Content:
{json.dumps(state['content'], indent=2)}

User Feedback: {feedback}

Please revise the content based on the user's feedback."""
                    
                    agent = create_content_revision_agent()
                    revision_response = agent(revision_input)
                    revised_data = parse_json_response(revision_response)
                
                # Upload revised images to S3 and update URLs
                if "ads" in revised_data:
                    for ad in revised_data["ads"]:
                        if ad.get("ad_type") == "image_ad" and ad.get("content"):
                            # Check if content is a local file path
                            if ad["content"].startswith("output/") or ad["content"].endswith((".png", ".jpg", ".jpeg")):
                                print(f"📤 Uploading revised {ad['content']} to S3...")
                                s3_uri = upload_to_s3(ad["content"])
                                ad["content"] = s3_uri
                                print(f"✅ Uploaded to: {s3_uri}")
                
                print(f"✅ Orchestrator: Received revised content with S3 URIs")
                
                # Update state with revised content
                state["content"] = revised_data
                
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "stage": "content_review",
                    "session_id": session_id,
                    "message": "Content revised by ContentRevisionAgent based on your feedback!",
                    "agent_flow": [
                        "AudienceAgent → audience analysis ✅",
                        "BudgetAgent → budget allocation ✅", 
                        "PromptAgent → ad prompts ✅",
                        "ContentGenerationAgent → ad content ✅",
                        "ContentRevisionAgent → content revision ✅"
                    ],
                    "content_display": format_content_for_display(revised_data),
                    "instructions": "Use 'provide_feedback' action to approve or revise again"
                }
            
            else:
                return {
                    "orchestrator": "CampaignOrchestrator",
                    "error": f"Invalid feedback_type: {feedback_type}. Use 'approve' or 'revise'",
                    "stage": "content_review"
                }
            
        else:
            return {
                "orchestrator": "CampaignOrchestrator",
                "error": f"Invalid action: {action}. Use 'start_campaign', 'provide_feedback', 'monitor_campaign', or 'advanced_revision'",
                "available_actions": [
                    "start_campaign - Start a new marketing campaign",
                    "provide_feedback - Approve or revise campaign content", 
                    "monitor_campaign - Monitor campaign performance in real-time",
                    "advanced_revision - Advanced content revision with multiple strategies"
                ]
            }
            
    except Exception as e:
        import traceback
        return {
            "orchestrator": "CampaignOrchestrator",
            "error": f"Orchestration error: {str(e)}",
            "traceback": traceback.format_exc(),
            "debug_payload_received": str(payload) if 'payload' in locals() else "payload not defined"
        }
if __name__ == "__main__":
    app.run()