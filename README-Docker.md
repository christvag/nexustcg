# TCG Grading Service - Docker Deployment

This guide explains how to run the TCG Grading Service using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for multi-service setup)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Clone and navigate to the project:**
```bash
cd gradingsiteproject
```

2. **Copy environment file:**
```bash
cp .env.example .env.local
```

3. **Edit `.env.local` with your configuration:**
- Add your Stripe API keys
- Configure other environment variables as needed

4. **Build and run with Docker Compose:**
```bash
docker-compose up --build
```

The application will be available at http://localhost:3000

### Option 2: Using Docker directly

1. **Build the Docker image:**
```bash
docker build -t tcg-grading-service .
```

2. **Run the container:**
```bash
docker run -d \
  --name tcg-grading-app \
  -p 3000:3000 \
  --env-file .env.local \
  tcg-grading-service
```

### Option 3: Using build scripts

**For Linux/Mac:**
```bash
chmod +x scripts/docker-build.sh
./scripts/docker-build.sh
```

**For Windows:**
```cmd
scripts\docker-build.bat
```

## Multi-Service Setup

To run with PostgreSQL and Redis:

```bash
docker-compose --profile database --profile cache up --build
```

This will start:
- TCG Grading Application (port 3000)
- PostgreSQL Database (port 5432)
- Redis Cache (port 6379)

## Environment Variables

Create a `.env.local` file with:

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Database (optional)
DATABASE_URL=postgresql://postgres:password@postgres:5432/tcg_grading

# Redis (optional)
REDIS_URL=redis://redis:6379
```

## Docker Commands

### Build image:
```bash
docker build -t tcg-grading-service .
```

### Run container:
```bash
docker run -p 3000:3000 tcg-grading-service
```

### View logs:
```bash
docker logs tcg-grading-app
```

### Stop container:
```bash
docker stop tcg-grading-app
```

### Remove container:
```bash
docker rm tcg-grading-app
```

### Health Check:
```bash
curl http://localhost:3000/api/health
```

## Production Deployment

1. **Update environment variables in `.env.production`**
2. **Build for production:**
```bash
docker build -t tcg-grading-service:production .
```

3. **Deploy to your container orchestrator (Kubernetes, Docker Swarm, etc.)**

## Troubleshooting

### Port already in use:
```bash
docker stop $(docker ps -q --filter "publish=3000")
```

### View container logs:
```bash
docker logs -f tcg-grading-app
```

### Rebuild with no cache:
```bash
docker build --no-cache -t tcg-grading-service .
```

### Clean up:
```bash
docker system prune -a
```

## Performance Optimization

The Docker image is optimized with:
- Multi-stage build to reduce image size
- Standalone output for faster cold starts
- Non-root user for security
- Health checks for reliability
- Alpine Linux base for minimal footprint

## Security Features

- Runs as non-root user (nextjs:nodejs)
- Uses Alpine Linux for security
- Environment variables for secrets
- Health check endpoint
- Minimal attack surface