# Use a Python 3.9 image as the base image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
# Copy the models directory to the container

RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the container
COPY . .

# Expose the application port
EXPOSE 8000

# Ensure logs directory exists
RUN mkdir -p /app/logs

# Command to run the FastAPI app (adjust the path to your main.py file if necessary)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" , "--reload"]
