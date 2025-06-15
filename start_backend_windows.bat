:: Windows Only script, make sure docker is running

@echo off
setlocal

echo [1/3] Start all Container...
docker-compose up -d

echo [2/3] Change venv...
:: Change this path to your venv
call "C:/Users/erikp/PycharmProjects/blockchain/.venv/Scripts/activate.bat"

echo [3/3] Start worker...
cd Worker
start python worker.py
cd ..

endlocal