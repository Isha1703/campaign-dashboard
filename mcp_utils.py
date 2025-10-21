#!/usr/bin/env python3
"""
MCP utilities for token management and client setup
"""

import json
import requests
import base64
import os
from typing import Dict, Optional

def get_oauth_token(client_info: Dict) -> Optional[str]:
    """
    Get OAuth token for MCP Gateway using client credentials flow
    
    Args:
        client_info: Dictionary containing client_id, client_secret, token_endpoint, scope
        
    Returns:
        Access token string or None if failed
    """
    try:
        # Prepare the request
        token_endpoint = client_info["token_endpoint"]
        client_id = client_info["client_id"]
        client_secret = client_info["client_secret"]
        scope = client_info["scope"]
        
        # Create Basic Auth header
        credentials = f"{client_id}:{client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {encoded_credentials}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "client_credentials",
            "scope": scope
        }
        
        print(f"🔑 Requesting OAuth token from: {token_endpoint}")
        
        response = requests.post(token_endpoint, headers=headers, data=data, timeout=30)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            if access_token:
                print(f"✅ OAuth token obtained successfully")
                return access_token
            else:
                print(f"❌ No access_token in response: {token_data}")
                return None
        else:
            print(f"❌ Token request failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting OAuth token: {e}")
        return None

def load_mcp_config(config_file: str = "real_mcp_gateway_config.json") -> Optional[Dict]:
    """
    Load MCP gateway configuration from file
    
    Args:
        config_file: Path to the configuration file
        
    Returns:
        Configuration dictionary or None if failed
    """
    try:
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)
                print(f"✅ Loaded MCP config from: {config_file}")
                return config
        else:
            print(f"⚠️ MCP config file not found: {config_file}")
            return None
    except Exception as e:
        print(f"❌ Error loading MCP config: {e}")
        return None

def test_mcp_connection(gateway_url: str, access_token: str) -> bool:
    """
    Test MCP gateway connection by calling list_tools
    
    Args:
        gateway_url: MCP gateway URL
        access_token: OAuth access token
        
    Returns:
        True if connection successful, False otherwise
    """
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        }
        
        print(f"🔍 Testing MCP connection to: {gateway_url}")
        
        response = requests.post(gateway_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if 'result' in result:
                tools = result['result'].get('tools', [])
                print(f"✅ MCP connection successful - {len(tools)} tools available")
                for tool in tools[:3]:  # Show first 3 tools
                    print(f"   - {tool.get('name', 'Unknown')}")
                if len(tools) > 3:
                    print(f"   ... and {len(tools) - 3} more tools")
                return True
            else:
                print(f"❌ MCP connection failed - no result: {result}")
                return False
        else:
            print(f"❌ MCP connection failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing MCP connection: {e}")
        return False

if __name__ == "__main__":
    # Test the utilities
    print("🧪 Testing MCP Utilities")
    print("=" * 50)
    
    # Load config
    config = load_mcp_config()
    if config:
        # Get token
        token = get_oauth_token(config["client_info"])
        if token:
            # Test connection
            test_mcp_connection(config["gateway_url"], token)
        else:
            print("❌ Failed to get OAuth token")
    else:
        print("❌ Failed to load MCP config")