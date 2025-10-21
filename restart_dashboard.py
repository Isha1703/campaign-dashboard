#!/usr/bin/env python3
"""
Restart Dashboard Server
Stops any running dashboard processes and starts a fresh server
"""

import subprocess
import time
import os
import signal
import psutil

def find_dashboard_processes():
    """Find running dashboard server processes"""
    dashboard_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
            
            # Look for dashboard server processes
            if any(keyword in cmdline.lower() for keyword in [
                'simple_dashboard_server.py',
                'dashboard_server.py', 
                'uvicorn',
                'fastapi'
            ]) and 'python' in cmdline.lower():
                dashboard_processes.append(proc)
                
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    return dashboard_processes

def stop_dashboard_processes():
    """Stop running dashboard processes"""
    processes = find_dashboard_processes()
    
    if not processes:
        print("ℹ️ No dashboard processes found running")
        return True
    
    print(f"🛑 Found {len(processes)} dashboard process(es) to stop")
    
    for proc in processes:
        try:
            print(f"   Stopping PID {proc.pid}: {' '.join(proc.cmdline())}")
            proc.terminate()
            
            # Wait for graceful shutdown
            try:
                proc.wait(timeout=5)
                print(f"   ✅ Process {proc.pid} stopped gracefully")
            except psutil.TimeoutExpired:
                print(f"   ⚠️ Force killing process {proc.pid}")
                proc.kill()
                proc.wait()
                
        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            print(f"   ⚠️ Could not stop process {proc.pid}: {e}")
    
    return True

def start_dashboard_server():
    """Start the dashboard server"""
    print("🚀 Starting dashboard server...")
    
    # Check if the server file exists
    server_files = [
        'simple_dashboard_server.py',
        'dashboard_server.py',
        'demo_server.py'
    ]
    
    server_file = None
    for file in server_files:
        if os.path.exists(file):
            server_file = file
            break
    
    if not server_file:
        print("❌ No dashboard server file found")
        return False
    
    print(f"📄 Using server file: {server_file}")
    
    try:
        # Start the server in the background
        process = subprocess.Popen(
            ['python', server_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        print(f"✅ Dashboard server started with PID: {process.pid}")
        print("🌐 Server should be available at:")
        print("   - http://localhost:8002 (main server)")
        print("   - http://localhost:3000 (if using alternative port)")
        
        # Wait a moment to check if it started successfully
        time.sleep(2)
        
        if process.poll() is None:
            print("✅ Server is running successfully")
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Server failed to start:")
            print(f"   stdout: {stdout}")
            print(f"   stderr: {stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

def main():
    """Main restart function"""
    print("🔄 Dashboard Server Restart Tool")
    print("=" * 50)
    
    # Step 1: Stop existing processes
    print("Step 1: Stopping existing dashboard processes...")
    stop_dashboard_processes()
    
    # Step 2: Wait a moment
    print("Step 2: Waiting for cleanup...")
    time.sleep(2)
    
    # Step 3: Start new server
    print("Step 3: Starting fresh dashboard server...")
    success = start_dashboard_server()
    
    if success:
        print("\n✅ Dashboard restart completed successfully!")
        print("\n🎯 Next steps:")
        print("1. Open your browser to http://localhost:8002")
        print("2. Clear browser cache (Ctrl+Shift+R)")
        print("3. The dashboard should now show the correct session data:")
        print("   - Urban Professionals (not Data Analysts)")
        print("   - Outdoor Enthusiasts")
        print("   - Fashion-Forward Young Adults")
        print("   - Images/videos of boots and fashion products")
    else:
        print("\n❌ Dashboard restart failed")
        print("You may need to start the server manually:")
        print("   python simple_dashboard_server.py")

if __name__ == "__main__":
    main()