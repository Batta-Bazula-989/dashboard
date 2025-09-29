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

- ✅ **Persistent Data Storage** - Data stays in memory within Railway instance
- ✅ **Real-time Updates** - HTTP polling every 2 seconds
- ✅ **Multi-tenant Ready** - Deploy multiple instances for different customers
- ✅ **Automatic HTTPS** - Secure connections
- ✅ **Easy Scaling** - Add more instances as needed

## 🔧 Configuration

### Environment Variables (Optional)
- `PORT` - Server port (Railway sets this automatically)
- `NODE_ENV` - Environment (production/development)

### API Endpoints
- `GET /api/data` - Retrieve all stored data
- `POST /api/data` - Store new data from n8n
- `GET /health` - Health check endpoint

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
- **Body**: Your data object

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
