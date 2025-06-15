from pymongo import MongoClient

def init_progress(id : int):
    db = get_db()
    collection = db["progress"]
    collection.insert_one({ "id": id , "percent": 0 })

def update_progress(id : int, progress : int):
    db = get_db()
    collection = db["progress"]
    query = { "id": id }
    new_values = { "$set": { "percent": progress } }
    collection.update_one(query, new_values)

def set_result():
    db = get_db()
    collection = db["result"]

def get_progress(id : int):
    db = get_db()
    collection = db["progress"]
    query = { "id": id }
    return collection.find_one(query)

def get_db():
    url =  "mongodb://localhost:27017/"
    client = MongoClient(url)
    db = client["Quantum-Encoding-DB"]
    return db

