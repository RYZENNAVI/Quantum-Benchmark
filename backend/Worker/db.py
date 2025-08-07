from pymongo import MongoClient
import os

def get_db():
    """
    Establish and return a connection to the MongoDB 'Quantum-Encoding-DB' database.

    Returns:
        Database object representing 'Quantum-Encoding-DB'.
    """
    url =  os.getenv("MONGO_URI", "mongodb://host.docker.internal:27017/")
    client = MongoClient(url)
    db = client["Quantum-Encoding-DB"]
    return db