#!/usr/bin/env python3
"""
Generate sessions manifest for Amplify deployment
This creates a sessions.json file that lists all available sessions
"""

import os
import json
from pathlib import Path
from datetime import datetime

def generate_sessions_manifest():
    """Generate a manifest of all available sessions"""
    output_dir = Path("public/agent_outputs")
    
    if not output_dir.exists():
        print("❌ No agent_outputs directory found")
        return
    
    # Find all session directories
    sessions = []
    for session_dir in output_dir.iterdir():
        if session_dir.is_dir() and session_dir.name.startswith("session-"):
            session_id = session_dir.name
            
            # Get session metadata
            progress_file = session_dir / "session_progress.json"
            if progress_file.exists():
                try:
                    with open(progress_file, 'r', encoding='utf-8') as f:
                        progress_data = json.load(f)
                    
                    sessions.append({
                        "session_id": session_id,
                        "started_at": progress_data.get("started_at"),
                        "last_updated": progress_data.get("last_updated"),
                        "status": progress_data.get("status", "unknown"),
                        "progress_percentage": progress_data.get("progress_percentage", 0),
                        "agents_completed": progress_data.get("agents_completed", [])
                    })
                except Exception as e:
                    print(f"⚠️ Could not read progress for {session_id}: {e}")
                    sessions.append({
                        "session_id": session_id,
                        "status": "unknown"
                    })
    
    # Sort by last_updated (most recent first)
    sessions.sort(key=lambda x: x.get("last_updated", ""), reverse=True)
    
    # Create manifest
    manifest = {
        "success": True,
        "sessions": [s["session_id"] for s in sessions],
        "count": len(sessions),
        "details": sessions,
        "generated_at": datetime.now().isoformat()
    }
    
    # Save manifest
    manifest_file = output_dir / "sessions.json"
    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated sessions manifest: {len(sessions)} sessions")
    print(f"📄 Saved to: {manifest_file}")
    
    for session in sessions:
        print(f"   - {session['session_id']} ({session.get('status', 'unknown')})")

if __name__ == "__main__":
    generate_sessions_manifest()
