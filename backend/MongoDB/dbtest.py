from pymongo import MongoClient
import pprint

# Connect to the local MongoDB server (default port 27017)
client = MongoClient("mongodb://localhost:27017/")

# Access the 'Quantum-Encoding-DB' database
db = client["Quantum-Encoding-DB"]

# Access the 'ansatz' collection within the database
collection = db["ansatz"]

#collection = db["encodingHistory"]
#collection.delete_many({})  

# Count the number of documents in the 'ansatz' collection
count = collection.count_documents({})
print(f"There are currently {count} records in the ansatz collection:\n")

# Retrieve and print all documents from the collection,
# sorted by descending MongoDB-internal _id (most recent first)
for doc in collection.find().sort("_id", -1):
    pprint.pprint(doc)
    print("-" * 50)