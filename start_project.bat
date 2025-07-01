:: Windows Only script, make sure docker is running

@echo off
setlocal

cd backend
echo [1/3] Start backend...
docker-compose up -d

cd Worker
echo [2/3] Start worker...
docker-compose up -d

cd ..
cd ..
echo [3/3] Start frontend...
cd frontend
docker-compose up -d
cd ..

endlocal