# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY mcp_requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r mcp_requirements.txt

# Copy application files
COPY simple_dashboard_server.py .
COPY market_campaign.py .
COPY mcp_*.py .
COPY strands_tools.py .
COPY *.json .

# Create necessary directories
RUN mkdir -p public/agent_outputs public/downloads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["python", "simple_dashboard_server.py"]
