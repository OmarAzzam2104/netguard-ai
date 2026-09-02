# 1. Start from an official Python base image (the foundation of our box)
FROM python:3.12-slim

# 2. Set the working directory inside the container
WORKDIR /app  

# 3. Copy the requirements file in first, then install packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the project into the container
COPY . .

# 5. Tell Docker the container will listen on port 8000
EXPOSE 8000

# 6. The command that runs when the container starts
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]