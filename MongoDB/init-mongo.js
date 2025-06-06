db = db.getSiblingDB('Quantum-Encoding-DB');

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
        }
      }
    }
  }
});

// No validator added; structure is unrestricted to allow FastAPI to write freely
db.createCollection('encodingHistory');

// User collection validator retained
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

// Insert a FastAPI-style example document for testing
db.encodingHistory.insertOne({
  circuit: {
    qubits: 3,
    gates: [
      {
        id: "g1",
        type: "RY",
        target: [0],
        params: ["theta_1"],
        timeStep: 0
      }
    ]
  },
  valid: true,
  errors: []
});

// Retain other initialization data
db.user.insertMany([
  { name: 'Erik', id: 999, passwordHash: '<PASSWORD>' },
  { name: 'Jakob', id: 25, passwordHash: '<PASSWORD>' }
]);

db.ansatz.insertMany([
  { name: 'CVNeuralNetLayers', id: 1 },
  { name: 'RandomLayers', id: 2 },
  { name: 'StronglyEntanglingLayers', id: 3 }
]);
