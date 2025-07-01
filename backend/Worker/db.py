from pymongo import MongoClient

def get_db():
    """
    Establish and return a connection to the MongoDB 'Quantum-Encoding-DB' database.

    Returns:
        Database object representing 'Quantum-Encoding-DB'.
    """
    url =  "mongodb://localhost:27017/"
    client = MongoClient(url)
    db = client["Quantum-Encoding-DB"]
    return db