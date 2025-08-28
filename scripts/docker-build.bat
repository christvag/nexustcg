@echo off
REM Build and run the TCG Grading site with Docker (Windows)

echo 🚀 Building TCG Grading Service Docker Image...

REM Build the Docker image
docker build -t tcg-grading-service:latest .

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker build failed!
    exit /b 1
)

echo ✅ Docker image built successfully!

echo 🐳 Starting the application...

REM Run the container
docker run -d ^
  --name tcg-grading-app ^
  -p 3000:3000 ^
  --env-file .env.production ^
  tcg-grading-service:latest

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start container!
    exit /b 1
)

echo ✅ Application started at http://localhost:3000
echo 📊 Check logs with: docker logs tcg-grading-app
echo 🛑 Stop with: docker stop tcg-grading-app