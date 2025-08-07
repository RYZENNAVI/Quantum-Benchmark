import json
import os

from bson import ObjectId
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

def get_next_id(collection: str):
    """
        Get next id from collection.

        Args:
        collection (str): The name of the collection.

        Returns:
            int: next id from the collection.
    """
    db = get_db()
    col = db[collection]
    last_doc = col.find_one(sort=[("id", -1)])
    if last_doc is None:
        next_id = 1
    else:
        next_id = last_doc["id"] + 1
    return next_id

def init_progress(id: int):
    """
    Initialize a progress entry for a given encoding id.

    Args:
        id (int): The benchmarkRuns id.
    """
    db = get_db()
    collection = db["benchmarkRuns"]
    query = {"id": id}
    new_values = {"$set": {"status": "progress", "progress": 0}}
    collection.update_one(query, new_values)

def update_progress(id: int, progress: int):
    """
    Update the progress percentage for a given benchmarkRuns object id.

    Args:
        id (int): The benchmarkRuns id.
        progress (int): The new progress percentage value.
    """
    db = get_db()
    collection = db["benchmarkRuns"]
    query = {"id": id}
    new_values = {"$set": {"status": "progress", "progress": progress}}
    collection.update_one(query, new_values)

def finished_progress(id: int):
    """
    Update the progress percentage for a given benchmarkRuns object id.

    Args:
        id (int): The benchmarkRuns object id.
        progress (int): The new progress percentage value.
    """
    db = get_db()
    collection = db["benchmarkRuns"]
    query = {"id": id}
    new_values = {"$set": {"status": "done", "progress": 100}}
    collection.update_one(query, new_values)

def set_result(result):
    """
    Set the result of a given benchmarkRun.

    Args:
        result (dict): The result object.
    """
    db = get_db()
    collection = db["benchmarkResults"]
    collection.insert_one(result)

def get_benchmarkRuns(id: int):
    """
    Retrieve the benchmarkRuns document for a given benchmarkRuns object id.

    Args:
        id (int): The benchmarkRuns id.

    Returns:
        dict or None: The progress document if found, else None.
    """
    db = get_db()
    collection = db["benchmarkRuns"]
    query = {"id": id}
    return collection.find_one(query)
