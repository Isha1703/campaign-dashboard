# ✅ Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Pre-Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] Backend API responds correctly
- [ ] Build completes without errors (`npm run build`)
- [ ] All tests passing (`npm test`)
- [ ] Code committed to Git
- [ ] `.env` file not committed (in `.gitignore`)

### Configuration
- [ ] `.env.example` created with all required variables
- [ ] AWS credentials obtained
- [ ] AgentCore API key obtained (if needed)
- [ ] CORS origins configured for production URLs
- [ ] Environment variables documented

### Security
- [ ] No hardcoded secrets in code
- [ ] API keys stored in environment variables
- [ ] CORS properly configured
- [ ] Rate limiting considered
- [ ] Input validation in place

## Deployment

### Frontend
- [ ] Build command works: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] Environment variables set in deployment platform
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled
- [ ] CDN configured (optional)

### Backend
- [ ] Python dependencies listed in `requirements.txt`
- [ ] MCP dependencies listed in `mcp_requirements.txt`
- [ ] Health check endpoint working: `/health`
- [ ] Environment variables set
- [ ] Port configured correctly
- [ ] File upload directories created
- [ ] Database migrations run (if applicable)

### Infrastructure
- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Frontend can reach backend API
- [ ] S3 bucket accessible
- [ ] Logs configured
- [ ] Monitoring set up

## Post-Deployment

### Testing
- [ ] Homepage loads correctly
- [ ] All routes accessible
- [ ] API calls work
- [ ] Campaign creation works
- [ ] Content generation works
- [ ] Media files load (images/videos)
- [ ] Analytics display correctly
- [ ] Optimization features work
- [ ] Mobile responsive
- [ ] Cross-browser tested

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] Images optimized
- [ ] Gzip compression enabled
- [ ] Caching configured
- [ ] No memory leaks

### Monitoring
- [ ] Health checks configured
- [ ] Error logging set up
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications set up
- [ ] Log retention configured

### Documentation
- [ ] README updated with deployment URL
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide created

### Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] API authentication enabled (if needed)
- [ ] Rate limiting active
- [ ] CORS properly restricted
- [ ] Secrets rotated regularly
- [ ] Backup strategy in place

## Maintenance

### Regular Tasks
- [ ] Monitor logs weekly
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Update dependencies monthly
- [ ] Backup data regularly
- [ ] Test disaster recovery

### Updates
- [ ] Version control strategy
- [ ] Rollback plan documented
- [ ] Staging environment available
- [ ] CI/CD pipeline configured (optional)
- [ ] Change log maintained

## Platform-Specific

### Docker
- [ ] Docker and Docker Compose installed
- [ ] `.dockerignore` configured
- [ ] Volumes for persistent data
- [ ] Container health checks
- [ ] Resource limits set
- [ ] Restart policy configured

### Vercel
- [ ] Project linked to Git repository
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain added (optional)
- [ ] Preview deployments enabled
- [ ] Production branch configured

### Railway
- [ ] Repository connected
- [ ] Environment variables set
- [ ] Health check path configured
- [ ] Restart policy set
- [ ] Resource limits configured
- [ ] Logs accessible

### AWS
- [ ] IAM roles configured
- [ ] S3 bucket created and accessible
- [ ] CloudFront distribution set up (optional)
- [ ] Route 53 DNS configured (optional)
- [ ] CloudWatch alarms set
- [ ] Cost alerts configured

## Cost Management

- [ ] Estimated monthly cost calculated
- [ ] Billing alerts set up
- [ ] Resource usage monitored
- [ ] Auto-scaling configured (if needed)
- [ ] Unused resources cleaned up
- [ ] Cost optimization reviewed

## Compliance

- [ ] Privacy policy updated
- [ ] Terms of service current
- [ ] GDPR compliance (if applicable)
- [ ] Data retention policy defined
- [ ] User data handling documented
- [ ] Cookie consent implemented (if needed)

## Launch

### Pre-Launch
- [ ] All checklist items completed
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Rollback plan ready
- [ ] Monitoring dashboard open

### Launch Day
- [ ] Deploy to production
- [ ] Verify all features work
- [ ] Monitor logs and metrics
- [ ] Test critical user flows
- [ ] Announce launch
- [ ] Collect initial feedback

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Address any issues immediately
- [ ] Collect user feedback
- [ ] Document lessons learned
- [ ] Plan next iteration

---

## Quick Reference

### Essential URLs
- Frontend: ___________________________
- Backend API: ___________________________
- Health Check: ___________________________
- Monitoring: ___________________________
- Logs: ___________________________

### Essential Credentials
- AWS Console: ___________________________
- Deployment Platform: ___________________________
- Domain Registrar: ___________________________
- Monitoring Service: ___________________________

### Emergency Contacts
- DevOps Lead: ___________________________
- Backend Developer: ___________________________
- Frontend Developer: ___________________________
- Product Owner: ___________________________

---

## Notes

Use this space for deployment-specific notes:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** _______________
**Status:** ⬜ In Progress  ⬜ Complete  ⬜ Issues

---

Print this checklist and check off items as you complete them!
