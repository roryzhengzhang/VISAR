FROM python:3.9-slim-buster

WORKDIR /app/backend-server

COPY . .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 8088
CMD ["python", "server.py"]