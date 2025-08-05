# CircleCI Setup for Pizzeria Senza Cipolla

This document explains how to set up CircleCI for automated testing and deployment of the pizzeria project.

## 🚀 Quick Setup

### Step 1: Connect to CircleCI

1. **Go to CircleCI**: https://circleci.com/
2. **Sign up/Login** with your GitHub account
3. **Add Project**: Find your pizzeria repository and click "Set Up Project"
4. **Use Existing Config**: Select "Use the .circleci/config.yml in my repo"

### Step 2: Configure Environment Variables

In CircleCI project settings, add these environment variables:

```bash
# Stripe Keys (for payment processing)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Deployment Keys (if using Vercel)
VERCEL_TOKEN=your_vercel_token

# Notification Keys (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Step 3: Push to Repository

```bash
git add .circleci/config.yml
git add negoziooo/tests/
git add CIRCLECI_SETUP.md
git commit -m "Add CircleCI configuration"
git push origin main
```

## 🔄 What CircleCI Does

### Automatic Testing
- **Linting**: Checks code quality with ESLint
- **Type Checking**: Validates TypeScript types
- **Build Testing**: Ensures the app builds successfully
- **Security Audit**: Checks for vulnerable dependencies

### Automatic Deployment
- **Staging**: Deploys `development` branch to staging environment
- **Production**: Deploys `main` branch to production
- **Security**: Runs nightly security checks

## 📊 Workflow Overview

```
Code Push → Build → Test → Security Check → Deploy
```

### Branch Strategy
- **`main`** → Production deployment
- **`development`** → Staging deployment
- **Feature branches** → Build and test only

## 🛠️ Configuration Details

### Jobs Included:
1. **build_and_test**: Builds the application and runs linting
2. **test**: Runs unit tests (when available)
3. **security_audit**: Checks for security vulnerabilities
4. **deploy_staging**: Deploys to staging environment
5. **deploy_production**: Deploys to production

### Caching:
- Node.js dependencies are cached for faster builds
- Build artifacts are shared between jobs

### Notifications:
- Build status notifications (can be configured for Slack/email)
- Security audit results

## 🔧 Customization

### Adding Real Tests
Replace the basic test in `negoziooo/tests/basic.test.js` with:
- Jest tests for components
- Cypress tests for end-to-end testing
- API tests for backend functionality

### Adding Deployment
Update the deploy jobs in `.circleci/config.yml` with:
- Your hosting provider commands (Vercel, Netlify, etc.)
- Database migration commands
- Cache invalidation

### Environment-Specific Configs
- Add different environment variables for staging/production
- Configure different Supabase projects for each environment
- Set up different Stripe accounts for testing/production

## 📈 Monitoring

### Build Status
- Check build status at: https://app.circleci.com/pipelines/github/YOUR_USERNAME/YOUR_REPO
- Green builds = successful deployment
- Red builds = issues that need fixing

### Performance
- Build times are tracked
- Test coverage can be added
- Deployment frequency is monitored

## 🚨 Troubleshooting

### Common Issues:
1. **Build Fails**: Check Node.js version compatibility
2. **Tests Fail**: Ensure all dependencies are installed
3. **Deployment Fails**: Verify environment variables are set
4. **Security Audit Fails**: Update vulnerable dependencies

### Getting Help:
- Check CircleCI documentation: https://circleci.com/docs/
- Review build logs in CircleCI dashboard
- Check this project's GitHub issues

## 🎯 Next Steps

1. **Set up CircleCI account** and connect repository
2. **Configure environment variables** for your specific setup
3. **Test the pipeline** by pushing a small change
4. **Add real tests** as your application grows
5. **Configure deployment** to your hosting provider

## 📝 Notes

- The current configuration is optimized for a Next.js/React application
- Supabase integration is pre-configured
- Stripe payment processing is included
- Security auditing runs nightly on the main branch

Happy coding! 🍕
