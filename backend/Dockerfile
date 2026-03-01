FROM python:3.10-slim

# install node so we can build the frontend during image build
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy frontend source and build it
COPY frontend ./frontend
RUN cd frontend && npm install && npm run build

# copy rest of backend code
COPY . .

CMD ["python", "app.py"]
