# Progressly Backend - Deployment Guide

## Deployment to Render

### Prerequisites
- Render account (https://render.com)
- GitHub repository connected
- MongoDB Atlas account (or local MongoDB)

### Environment Variables Required

Before deploying, ensure these environment variables are set on Render:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/progressly?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters
JWT_EXPIRATION=7d
FRONTEND_URL=https://progressly-frontend.vercel.app
BACKEND_API_URL=https://progressly-backend.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Get connection string
5. Add your Render IP to IP whitelist (or use 0.0.0.0/0 for testing)
6. Use the connection string as MONGODB_URI

### Deployment Steps

1. Push code to GitHub
2. Go to https://render.com/dashboard
3. Click "New +" → "Web Service"
4. Select your "progressly-backend" GitHub repository
5. Configure:
   - **Name**: progressly-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Region**: Choose closest to you
   - **Plan**: Free tier (or paid for production)
6. Add environment variables
7. Click "Create Web Service"

### Database Configuration

For free tier, MongoDB Atlas free tier includes:
- 512MB storage
- 100k operations/day

For production, consider upgrading to a paid plan.

### SMTP Configuration (Optional)

Email sending requires SMTP credentials. Google Gmail example:

1. Enable 2FA on Google Account
2. Create App Password (https://myaccount.google.com/apppasswords)
3. Use app password as SMTP_PASS

### Build & Start Commands

The `render.yaml` file in the repo root contains the configuration.

- **Build**: Compiles TypeScript to JavaScript
- **Start**: Runs the compiled application on port 3001

### Logs & Monitoring

View logs on Render dashboard → Web Service → Logs

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with development values
cp .env.example .env

# Start dev server
npm run start:dev

# Build for production
npm run build
```

## Testing Endpoints

After deployment, test:

```bash
curl https://progressly-backend.onrender.com/api/health
```

## Troubleshooting

- **Build fails**: Check `npm run build` locally first
- **Connection refused**: Verify MONGODB_URI and IP whitelist
- **Cold start**: Free tier sleeps after 15 minutes of inactivity
- **Port issues**: Ensure PORT environment variable is set

## Security Notes

- Never commit `.env` file
- Use strong JWT_SECRET (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Always use environment variables for secrets
- Regularly rotate API keys and passwords
