FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the backend application code
COPY backend/app.py .
COPY backend/celestrak.py .
COPY backend/orbit.py .
COPY backend/probability.py .
COPY backend/swpc.py .
COPY backend/utils.py .
COPY backend/start.sh .

# Make startup script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Run the application
CMD ["./start.sh"]