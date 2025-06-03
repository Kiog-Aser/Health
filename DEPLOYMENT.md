# 🚀 Deployment Guide - HealthTracker Pro

## Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd HealthTrackerPro

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## Production Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Follow the prompts to configure your deployment
```

### Option 2: Netlify
```bash
# Build the project
npm run build

# Deploy the 'out' folder to Netlify
# or connect your GitHub repo to Netlify for automatic deployments
```

### Option 3: Self-hosted with Docker
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["npm", "start"]
```

## PWA Installation

### Desktop Browsers
1. Visit the deployed app
2. Look for the "Install" icon in the address bar
3. Click to install as a desktop app

### Mobile Devices
1. Open the app in your mobile browser
2. Tap the browser menu (⋯)
3. Select "Add to Home Screen"
4. Confirm installation

## Environment Variables

Create a `.env.local` file for environment-specific configuration:

```bash
# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Optional: Error tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Optional: Database (when implemented)
MONGODB_URI=your-mongodb-connection-string

# Optional: Authentication (when implemented)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=your-app-url
```

## Performance Optimization

### Lighthouse Scores Target
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+
- **PWA**: 100

### Optimizations Included
- ✅ Image optimization with Next.js Image component (ready)
- ✅ Static generation for better performance
- ✅ Automatic code splitting
- ✅ PWA with service worker
- ✅ Responsive design
- ✅ Modern CSS with Tailwind
- ✅ TypeScript for better DX

## Monitoring & Analytics

### Recommended Tools
- **Performance**: Vercel Analytics / Google PageSpeed Insights
- **Error Tracking**: Sentry
- **User Analytics**: Google Analytics 4
- **Uptime Monitoring**: Vercel Pro / UptimeRobot

## Security Considerations

### Headers Configuration
The app includes security headers in `next.config.js`:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### HTTPS
- Always deploy with HTTPS enabled
- Use Vercel or Netlify for automatic SSL certificates
- For self-hosting, use Let's Encrypt or CloudFlare

## Backup & Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Monitor security vulnerabilities
- [ ] Review Lighthouse scores
- [ ] Update PWA manifest as needed
- [ ] Test offline functionality

### Backup Strategy (Future)
- Database backups (when implemented)
- Environment variables backup
- Source code in version control

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**PWA Not Installing**
- Check manifest.json is accessible
- Verify HTTPS is enabled
- Ensure service worker is registered

**Styling Issues**
- Verify Tailwind is configured correctly
- Check for CSS conflicts
- Use browser dev tools for debugging

## Support

For technical support:
1. Check the [README.md](./README.md) for basic setup
2. Review the [GitHub Issues](your-repo-issues-url)
3. Contact the development team

---

**Note**: This deployment guide covers the basic Next.js web app. Additional configuration may be needed when database and authentication features are implemented. 