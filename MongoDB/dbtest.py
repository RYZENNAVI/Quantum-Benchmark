from pymongo import MongoClient
import pprint

client = MongoClient("mongodb://localhost:27017/")
db = client["Quantum-Encoding-DB"]
collection = db["encodingHistory"]

# collection.delete_many({})  # Uncomment this line to delete all documents in encodingHistory

count = collection.count_documents({})
print(f"There are currently {count} records in the encodingHistory collection:\n")

for doc in collection.find().sort("_id", -1):  # Show most recent documents first
    pprint.pprint(doc)
    print("-" * 50)
