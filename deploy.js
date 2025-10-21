import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DEPLOYMENT_CONFIG = {
  name: 'campaign-dashboard-ui',
  description: 'Professional Marketing Campaign Dashboard',
  buildDir: 'dist',
  port: process.env.PORT || 3000
};

async function deploy() {
  console.log('🚀 Starting deployment process...');
  
  try {
    // Build the application
    console.log('📦 Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Create deployment manifest
    const manifest = {
      name: DEPLOYMENT_CONFIG.name,
      description: DEPLOYMENT_CONFIG.description,
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      port: DEPLOYMENT_CONFIG.port,
      healthCheck: '/health',
      routes: {
        '/': 'index.html',
        '/api/*': 'proxy:http://localhost:8000'
      }
    };
    
    writeFileSync(
      join(DEPLOYMENT_CONFIG.buildDir, 'deployment-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Create simple server for deployment
    const serverCode = `
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || ${DEPLOYMENT_CONFIG.port};

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: '${DEPLOYMENT_CONFIG.name}'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`🌟 Campaign Dashboard UI running on port \${PORT}\`);
  console.log(\`📊 Dashboard: http://localhost:\${PORT}\`);
  console.log(\`🔍 Health Check: http://localhost:\${PORT}/health\`);
});
`;
    
    writeFileSync('server.js', serverCode);
    
    // Create deployment package.json
    const deployPackage = {
      name: DEPLOYMENT_CONFIG.name,
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        express: '^4.18.2',
        'http-proxy-middleware': '^2.0.6'
      }
    };
    
    writeFileSync('deploy-package.json', JSON.stringify(deployPackage, null, 2));
    
    console.log('✅ Deployment build completed successfully!');
    console.log('');
    console.log('📋 Deployment Instructions:');
    console.log('1. Copy the dist/ folder to your deployment server');
    console.log('2. Copy server.js and deploy-package.json to your deployment server');
    console.log('3. Run: npm install (using deploy-package.json)');
    console.log('4. Run: npm start');
    console.log('');
    console.log('🔗 Local Development:');
    console.log(`   Dashboard: http://localhost:${DEPLOYMENT_CONFIG.port}`);
    console.log(`   Health Check: http://localhost:${DEPLOYMENT_CONFIG.port}/health`);
    console.log('');
    console.log('⚠️  Note: Ensure simple_dashboard_server.py is running on port 8000');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();