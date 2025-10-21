#!/usr/bin/env python3
"""
Strands Tools - Basic image generation tool for fallback
"""

def generate_image(prompt: str, width: int = 1024, height: int = 1024) -> str:
    """
    Generate image - fallback implementation that returns placeholder URL
    
    Args:
        prompt: Image generation prompt
        width: Image width (default 1024)
        height: Image height (default 1024)
        
    Returns:
        Placeholder image URL
    """
    # Return a placeholder URL for fallback
    return f"https://via.placeholder.com/{width}x{height}/4A90E2/ffffff?text=Marketing+Image"