import os
from pymongo import MongoClient

def get_db():
    """
    Establish and return a connection to the MongoDB 'Quantum-Encoding-DB' database.

    Returns:
        Database object representing 'Quantum-Encoding-DB'.
    """
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongo_uri)
    db = client["Quantum-Encoding-DB"]
    return db

def init_progress(id: int):
    """
    Initialize a progress entry for a given encoding ID.

    Args:
        id (int): The encoding id.
    """
    db = get_db()
    collection = db["progress"]
    collection.insert_one({"id": id, "percent": 0})

def update_progress(id: int, progress: int):
    """
    Update the progress percentage for a given encoding ID.

    Args:
        id (int): The encoding id.
        progress (int): The new progress percentage value.
    """
    db = get_db()
    collection = db["progress"]
    query = {"id": id}
    new_values = {"$set": {"percent": progress}}
    collection.update_one(query, new_values)

def get_progress(id: int):
    """
    Retrieve the progress document for a given encoding ID.

    Args:
        id (int): The encoding id.

    Returns:
        dict or None: The progress document if found, else None.
    """
    db = get_db()
    collection = db["progress"]
    query = {"id": id}
    return collection.find_one(query)