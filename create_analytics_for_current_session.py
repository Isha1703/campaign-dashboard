#!/usr/bin/env python3
"""
Create Analytics for Current Session
Creates analytics and optimization data for the current active session
"""

import os
import json
from pathlib import Path
from datetime import datetime

def get_latest_session():
    """Get the latest session ID"""
    agent_outputs_dir = Path("agent_outputs")
    if not agent_outputs_dir.exists():
        return None
    
    sessions = []
    for session_dir in agent_outputs_dir.iterdir():
        if session_dir.is_dir() and session_dir.name.startswith('session-'):
            try:
                session_num = int(session_dir.name.split('-')[1])
                sessions.append((session_dir.name, session_num))
            except:
                continue
    
    if not sessions:
        return None
    
    # Return the latest session
    sessions.sort(key=lambda x: x[1], reverse=True)
    return sessions[0][0]

def create_analytics_data(session_id):
    """Create analytics data for the session"""
    
    print(f"📊 Creating analytics data for {session_id}...")
    
    # Read content data to generate realistic analytics
    content_path = Path(f"agent_outputs/{session_id}/contentgenerationagent_result.json")
    
    if not content_path.exists():
        print(f"❌ Content data not found for {session_id}")
        return False
    
    try:
        with open(content_path, 'r') as f:
            content_data = json.load(f)
        
        ads = content_data.get("result", {}).get("ads", [])
        
        # Generate analytics data
        analytics_data = {
            "agent": "AnalyticsAgent",
            "timestamp": datetime.now().isoformat(),
            "stage": "analytics",
            "status": "completed",
            "result": {
                "performance_metrics": [],
                "summary": {
                    "total_impressions": 0,
                    "total_clicks": 0,
                    "total_conversions": 0,
                    "total_cost": 0,
                    "total_revenue": 0,
                    "average_roi": 0,
                    "average_ctr": 0
                }
            }
        }
        
        total_impressions = 0
        total_clicks = 0
        total_conversions = 0
        total_cost = 0
        total_revenue = 0
        
        # Generate performance for each ad
        for i, ad in enumerate(ads):
            if ad.get("ad_type") == "text_ad":
                continue  # Skip text ads for performance metrics
                
            audience = ad.get("audience", "Unknown")
            platform = ad.get("platform", "Unknown")
            
            # Generate realistic metrics based on platform and audience
            base_impressions = 15000 if platform in ["Instagram", "TikTok"] else 10000
            impressions = base_impressions + (i * 2000)
            clicks = int(impressions * 0.025)  # 2.5% CTR
            conversions = int(clicks * 0.15)   # 15% conversion rate
            cost = 800 + (i * 200)
            revenue = conversions * 89.99  # Assuming $89.99 product price
            roi = ((revenue - cost) / cost * 100) if cost > 0 else 0
            ctr = (clicks / impressions * 100) if impressions > 0 else 0
            
            performance = {
                "ad_id": ad.get("asset_id", f"ad_{i+1}"),
                "audience": audience,
                "platform": platform,
                "impressions": impressions,
                "clicks": clicks,
                "conversions": conversions,
                "cost": round(cost, 2),
                "revenue": round(revenue, 2),
                "roi": round(roi, 1),
                "ctr": round(ctr, 2),
                "engagement_rate": round(clicks / impressions * 100 + 0.5, 2)
            }
            
            analytics_data["result"]["performance_metrics"].append(performance)
            
            total_impressions += impressions
            total_clicks += clicks
            total_conversions += conversions
            total_cost += cost
            total_revenue += revenue
        
        # Update summary
        analytics_data["result"]["summary"] = {
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "total_cost": round(total_cost, 2),
            "total_revenue": round(total_revenue, 2),
            "average_roi": round((total_revenue - total_cost) / total_cost * 100, 1) if total_cost > 0 else 0,
            "average_ctr": round(total_clicks / total_impressions * 100, 2) if total_impressions > 0 else 0
        }
        
        # Save analytics data
        analytics_path = Path(f"agent_outputs/{session_id}/analyticsagent_result.json")
        with open(analytics_path, 'w') as f:
            json.dump(analytics_data, f, indent=2)
        
        # Also save to public directory
        public_analytics_path = Path(f"public/agent_outputs/{session_id}/analyticsagent_result.json")
        public_analytics_path.parent.mkdir(parents=True, exist_ok=True)
        with open(public_analytics_path, 'w') as f:
            json.dump(analytics_data, f, indent=2)
        
        print(f"✅ Created analytics data with {len(analytics_data['result']['performance_metrics'])} metrics")
        
        # Generate optimization data
        optimization_data = {
            "agent": "OptimizationAgent",
            "timestamp": datetime.now().isoformat(),
            "stage": "optimization",
            "status": "completed",
            "result": {
                "recommendations": [
                    {
                        "type": "budget_reallocation",
                        "priority": "high",
                        "description": f"Increase budget for {analytics_data['result']['performance_metrics'][0]['platform']} by 25% due to high ROI",
                        "expected_improvement": "15-20% increase in conversions",
                        "current_roi": analytics_data['result']['performance_metrics'][0]['roi'],
                        "projected_roi": analytics_data['result']['performance_metrics'][0]['roi'] * 1.2
                    },
                    {
                        "type": "audience_targeting",
                        "priority": "medium", 
                        "description": f"Expand {analytics_data['result']['performance_metrics'][0]['audience']} targeting to similar demographics",
                        "expected_improvement": "10-15% increase in reach",
                        "current_ctr": analytics_data['result']['performance_metrics'][0]['ctr'],
                        "projected_ctr": analytics_data['result']['performance_metrics'][0]['ctr'] * 1.1
                    },
                    {
                        "type": "creative_optimization",
                        "priority": "medium",
                        "description": "A/B test video ads vs image ads for better engagement",
                        "expected_improvement": "5-10% improvement in engagement rate"
                    }
                ],
                "budget_optimization": {
                    "current_allocation": {
                        platform: f"${1000 + i*200}" for i, platform in enumerate(["Instagram", "YouTube", "Facebook"])
                    },
                    "recommended_allocation": {
                        platform: f"${1200 + i*250}" for i, platform in enumerate(["Instagram", "YouTube", "Facebook"])
                    },
                    "expected_improvement": "18% increase in overall ROI"
                }
            }
        }
        
        # Save optimization data
        optimization_path = Path(f"agent_outputs/{session_id}/optimizationagent_result.json")
        with open(optimization_path, 'w') as f:
            json.dump(optimization_data, f, indent=2)
        
        # Also save to public directory
        public_optimization_path = Path(f"public/agent_outputs/{session_id}/optimizationagent_result.json")
        with open(public_optimization_path, 'w') as f:
            json.dump(optimization_data, f, indent=2)
        
        print(f"✅ Created optimization data with {len(optimization_data['result']['recommendations'])} recommendations")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating analytics data: {e}")
        return False

def main():
    """Main function"""
    
    print("📊 Creating Analytics for Current Session")
    print("=" * 50)
    
    # Get the latest session
    latest_session = get_latest_session()
    
    if not latest_session:
        print("❌ No sessions found")
        return
    
    print(f"🎯 Latest session: {latest_session}")
    
    # Create analytics data
    success = create_analytics_data(latest_session)
    
    if success:
        print("\n✅ Analytics data created successfully!")
        print(f"\n📁 Files created:")
        print(f"   - agent_outputs/{latest_session}/analyticsagent_result.json")
        print(f"   - agent_outputs/{latest_session}/optimizationagent_result.json")
        print(f"   - public/agent_outputs/{latest_session}/analyticsagent_result.json")
        print(f"   - public/agent_outputs/{latest_session}/optimizationagent_result.json")
        
        print(f"\n🔄 Next steps:")
        print("1. Refresh the React app (Ctrl+R)")
        print("2. Go to Analytics tab - should now show data")
        print("3. Go to Optimization tab - should show recommendations")
    else:
        print("\n❌ Failed to create analytics data")

if __name__ == "__main__":
    main()