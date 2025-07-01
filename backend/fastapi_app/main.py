from fastapi import FastAPI
from FastAPI_app.routes import encoding, dataset, run, result, resource
from FastAPI_app.rabbitmq import rabbitmq

app = FastAPI()

app.include_router(encoding.router, prefix="/api", tags=["Encoding"])
app.include_router(run.router, prefix="/api", tags=["Run"])
app.include_router(result.router, prefix="/api", tags=["Result"])
app.include_router(dataset.router, prefix="/api", tags=["Dataset"])
app.include_router(resource.router, prefix="/api", tags=["Resources"])

@app.on_event("startup")
def startup_event():
    rabbitmq.connect()
    rabbitmq.start_result_consumer()

@app.on_event("shutdown")
def shutdown_event():
    rabbitmq.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("FastAPI_app.main:app", host="0.0.0.0", port=8000)
