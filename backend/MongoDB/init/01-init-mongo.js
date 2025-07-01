// Switch to the Quantum-Encoding-DB database (creates it if it doesn't exist)
db = db.getSiblingDB('Quantum-Encoding-DB');

//Table Creation
db.createCollection('ansatz', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name"],
      properties: {
        id: {
          bsonType: "int",
          description: "Id of the ansatz"
        },
        name: {
          bsonType: "string",
          description: "Name of the ansatz"
        },
        url: {
          bsonType: "string",
          description: "Url of the ansatz infos"
        },
        description: {
          bsonType: "string",
          description: "Description of the ansatz"
        }
      }
    }
  }
});

db.createCollection('dataset', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name"],
      properties: {
        id: {
          bsonType: "int",
          description: "Id of the dataset"
        },
        name: {
          bsonType: "string",
          description: "Name of the dataset"
        },
        url: {
          bsonType: "string",
          description: "Url of the dataset infos"
        },
        description: {
          bsonType: "string",
          description: "Description of the dataset"
        }
      }
    }
  }
});

db.createCollection('encoding', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name"],
      properties: {
        id: {
          bsonType: "int",
          description: "Id of the encoding"
        },
        name: {
          bsonType: "string",
          description: "Name of the encoding"
        },
        url: {
          bsonType: "string",
          description: "Url of the encoding infos"
        },
        description: {
          bsonType: "string",
          description: "Description of the encoding"
        }
      }
    }
  }
});

// Create 'encodingHistory' collection without schema validation
// This is intentionally left open so FastAPI can write flexible documents
db.createCollection('encodingHistory');

// Create 'progress' collection with validation for frontend progress tracking
db.createCollection('progress', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "percent"],
      properties: {
        id: {
          bsonType: "int",
          description: "Id of the user"
        },
        percent: {
          bsonType: "int",
          description: "Progress in percent"
        }
      }
    }
  }
});

// Create 'results' collection without validation
// Intended to hold varied result structures from different processes
db.createCollection('results');

// Create 'user' collection with validation for authentication purposes
db.createCollection('user', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name", "passwordHash"],
      properties: {
        id: {
          bsonType: "int",
          description: "Id of the user"
        },
        name: {
          bsonType: "string",
          description: "Name of the user"
        },
        passwordHash: {
          bsonType: "string",
          description: "Password hash of the user"
        }
      }
    }
  }
});