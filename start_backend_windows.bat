:: Windows Only script, make sure docker is running

@echo off
setlocal

echo [1/5] Start MongoDB Container...
cd MongoDB
docker-compose up -d
cd ..

echo [2/5] Start RabbitMQ Container...
cd RabbitMQ
docker-compose up -d
cd ..

echo [3/5] Change venv...
:: Change this path to your venv
call "C:/Users/erikp/PycharmProjects/blockchain/.venv/Scripts/activate.bat"

echo [4/5] Start FastAPI-Application...
start python -m uvicorn fastapi_app.main:app --reload

echo [5/5] Start worker...
cd Worker
start python worker.py
cd ..

endlocal