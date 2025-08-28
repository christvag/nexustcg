#!/bin/bash

# Build and run the TCG Grading site with Docker

echo "🚀 Building TCG Grading Service Docker Image..."

# Build the Docker image
docker build -t tcg-grading-service:latest .

echo "✅ Docker image built successfully!"

echo "🐳 Starting the application..."

# Run the container
docker run -d \
  --name tcg-grading-app \
  -p 3000:3000 \
  --env-file .env.production \
  tcg-grading-service:latest

echo "✅ Application started at http://localhost:3000"
echo "📊 Check logs with: docker logs tcg-grading-app"
echo "🛑 Stop with: docker stop tcg-grading-app"