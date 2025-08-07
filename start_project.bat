:: Windows Only script, make sure docker is running

@echo off
setlocal


PUSHD backend
    echo "[1/3] Start backend..."
    docker-compose up -d --build

    PUSHD Worker
        echo "[2/3] Start worker..."
        docker-compose up -d --build
    POPD
POPD


::PUSHD frontend
::    echo "[3/3] Start frontend..."
::    docker-compose up -d
::POPD


endlocal
