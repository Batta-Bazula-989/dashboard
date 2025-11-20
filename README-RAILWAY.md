# Dashboard - Railway Deployment

## 🚀 Quick Deploy to Railway

### 1. Connect to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose this repository

### 2. Deploy
- Railway will automatically detect Node.js
- It will install dependencies and start the server
- You'll get a URL like: `https://your-app.railway.app`

### 3. Access Your Dashboard
- **Main Dashboard**: `https://your-app.railway.app`
- **API Endpoint**: `https://your-app.railway.app/api/data`
- **Health Check**: `https://your-app.railway.app/health`

## 📊 Features

- ✅ **API Key Authentication** - Secure all API endpoints with API key authentication
- ✅ **Persistent Data Storage** - Data stays in memory within Railway instance
- ✅ **Real-time Updates** - HTTP polling every 2 seconds
- ✅ **Multi-tenant Ready** - Deploy multiple instances for different customers
- ✅ **Automatic HTTPS** - Secure connections
- ✅ **Easy Scaling** - Add more instances as needed

## 🔧 Configuration

### Environment Variables

#### Required for Production:
- `API_KEY` or `DASHBOARD_API_KEY` - **REQUIRED** API key for authentication. Generate a strong random key (e.g., `openssl rand -hex 32`)
  - ⚠️ **Without this, all API endpoints are publicly accessible!**
  - The frontend will automatically receive this key via the HTML page
  - For n8n webhooks, include this key in the `X-API-Key` header

#### Optional:
- `PORT` - Server port (Railway sets this automatically)
- `NODE_ENV` - Environment (production/development)

### Setting API Key in Railway:
1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add new variable: `API_KEY` = `your-generated-api-key-here`
5. Redeploy your service

### API Endpoints

All `/api/*` endpoints require authentication via API key:

**Authentication Methods:**
- Header: `X-API-Key: your-api-key`
- Header: `Authorization: Bearer your-api-key`
- Query parameter: `?api_key=your-api-key` (less secure, not recommended)

**Endpoints:**
- `GET /api/data` - Retrieve all stored data (requires auth)
- `POST /api/data` - Store new data from n8n (requires auth)
- `DELETE /api/data` - Clear all data (requires auth)
- `GET /api/notifications` - Get notifications (requires auth)
- `POST /api/notification` - Create notification (requires auth)
- `GET /api/errors` - Get error notifications (requires auth)
- `GET /health` - Health check endpoint (no auth required)
- `GET /` - Main dashboard page (no auth required, but API calls from page require auth)

## 🎯 Multi-Tenant Setup

### For Multiple Customers:
1. **Deploy main instance** from this repo
2. **For each customer**: Create new Railway project from same repo
3. **Each gets unique URL**:
   - Customer 1: `https://customer1-dashboard.railway.app`
   - Customer 2: `https://customer2-dashboard.railway.app`
   - Customer 3: `https://customer3-dashboard.railway.app`

### n8n Integration:
- **Send data to**: `https://your-dashboard.railway.app/api/data`
- **Method**: POST
- **Content-Type**: application/json
- **Headers**: 
  - `X-API-Key: your-api-key` (required if API_KEY is set)
- **Body**: Your data object

**Example n8n HTTP Request Node:**
```
URL: https://your-dashboard.railway.app/api/data
Method: POST
Headers:
  Content-Type: application/json
  X-API-Key: {{ $env.API_KEY }}
Body: {{ $json }}
```

## 💰 Pricing

- **Free Tier**: $5 credit/month (usually enough for 1-2 small apps)
- **Pro Plan**: $5/month + usage (~$0.10/GB RAM per hour)
- **Example**: 1GB app running 24/7 = ~$7/month

## 🚀 Benefits Over Vercel

- ✅ **Persistent servers** - No data loss between requests
- ✅ **Real-time updates** - HTTP polling works reliably
- ✅ **Multi-tenant support** - Easy to deploy multiple instances
- ✅ **Better for Node.js** - Designed for backend applications
- ✅ **No cold starts** - Consistent performance

## 📝 Logs & Monitoring

- **View logs**: Railway dashboard → Your project → Deployments → View logs
- **Monitor**: Railway dashboard shows CPU, memory, and network usage
- **Health check**: Automatic health monitoring

## 🔄 Updates

- **Automatic**: Push to GitHub → Railway auto-deploys
- **Manual**: Railway dashboard → Deploy → Redeploy
- **Rollback**: Railway dashboard → Deployments → Rollback

---

**Your dashboard is now ready for production use!** 🎉
