FROM python:3.11-slim

# set work directory
WORKDIR /app

# install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy application
COPY . /app/FastAPI_app

# specify environment variables
ENV PYTHONPATH=/app

# expose port
EXPOSE 8000

CMD ["uvicorn", "FastAPI_app.main:app", "--host", "0.0.0.0", "--port", "8000"]

