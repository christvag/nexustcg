# Docker Deployment Guide

This guide will help you deploy the NEXUS TCGrading application using Docker.

## Prerequisites

- Docker installed ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose installed (comes with Docker Desktop)

## Quick Start

### 1. Build and Run with Docker Compose

The easiest way to deploy is using Docker Compose:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f tcg-grading-app

# Stop all services
docker-compose down
```

The application will be available at `http://localhost:3000`

### 2. Build Docker Image Only

If you prefer to build just the Docker image:

```bash
# Build the image
docker build -t nexus-tcgrading:latest .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -e JWT_SECRET=your-secret-key-here \
  --name tcgrading \
  nexus-tcgrading:latest

# View logs
docker logs -f tcgrading

# Stop the container
docker stop tcgrading
docker rm tcgrading
```

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# JWT Secret (IMPORTANT: Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-here

# Database Configuration (if using PostgreSQL)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=tcg_grading
DB_USER=postgres
DB_PASSWORD=password

# Stripe Configuration (if using payment features)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Node Environment
NODE_ENV=production
```

### Database Persistence

The SQLite database files are stored in the `./database` directory, which is mounted as a volume in the Docker container. This ensures your data persists even when the container is stopped or recreated.

**Important Files:**
- `database/graded-cards.db` - Population report database
- `database/user-management.db` - User and order data

## Services

The docker-compose setup includes:

1. **tcg-grading-app** (Port 3000)
   - Main Next.js application
   - SQLite databases for population reports and user management

2. **postgres** (Port 5432) - Optional
   - PostgreSQL database (if you want to migrate from SQLite)
   - Currently not actively used but available

## Common Commands

```bash
# Rebuild after code changes
docker-compose up -d --build

# View application logs
docker-compose logs -f tcg-grading-app

# View all logs
docker-compose logs -f

# Stop services
docker-compose stop

# Start services
docker-compose start

# Remove all containers and volumes
docker-compose down -v

# Access the container shell
docker-compose exec tcg-grading-app sh

# Check container status
docker-compose ps
```

## Database Management

### Backup SQLite Database

```bash
# Backup the population report database
docker cp tcgrading:/app/database/graded-cards.db ./backup-graded-cards-$(date +%Y%m%d).db

# Backup the user management database
docker cp tcgrading:/app/database/user-management.db ./backup-user-management-$(date +%Y%m%d).db
```

### Restore SQLite Database

```bash
# Restore database
docker cp ./backup-graded-cards-20241113.db tcgrading:/app/database/graded-cards.db
docker-compose restart tcg-grading-app
```

## Production Deployment

### Security Checklist

1. ✅ Change `JWT_SECRET` to a strong random value
2. ✅ Use environment-specific `.env` files (don't commit `.env.local`)
3. ✅ Enable HTTPS with a reverse proxy (nginx, Traefik, Caddy)
4. ✅ Set up regular database backups
5. ✅ Configure firewall rules
6. ✅ Update `POSTGRES_PASSWORD` if using PostgreSQL

### Example Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker-compose logs tcg-grading-app

# Check if port 3000 is already in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Database permission errors

```bash
# Fix database directory permissions (Linux/Mac)
chmod -R 777 ./database

# On Windows, ensure Docker has access to the database folder
```

### Can't access the application

1. Verify the container is running: `docker-compose ps`
2. Check logs: `docker-compose logs -f tcg-grading-app`
3. Verify port mapping: Application should be on `http://localhost:3000`
4. Check firewall settings

## Health Checks

```bash
# Check if the app is responding
curl http://localhost:3000

# Check container health
docker inspect --format='{{.State.Health.Status}}' tcgrading
```

## Updates and Maintenance

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Clean up old images
docker image prune -a
```

## Resource Limits

To limit container resources, add to `docker-compose.yml`:

```yaml
services:
  tcg-grading-app:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this guide
- Check Docker documentation: https://docs.docker.com/
