# Deployment Architecture

Define deployment strategy for the Supabase + Netlify stack.

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Netlify with automatic Git deployments
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** Global CDN with automatic optimization

**Backend Deployment:**
- **Platform:** Netlify Functions with automatic deployment
- **Build Command:** `npm run build:functions`
- **Deployment Method:** Git-based continuous deployment
- **Runtime:** Node.js 18.x with 10-second timeout

**Database Deployment:**
- **Platform:** Supabase hosted PostgreSQL
- **Migration Strategy:** Automatic migrations via Supabase CLI
- **Backup Strategy:** Automatic daily backups with 30-day retention

## CI/CD Pipeline

```yaml