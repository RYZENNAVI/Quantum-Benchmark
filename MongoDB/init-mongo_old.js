db = db.getSiblingDB('Quantum-Encoding-DB');

db.createCollection("encodingHistory"); 

// db.createCollection('ansatz', {
//   validator: {
//     $jsonSchema: {
//       bsonType: "object",
//       required: ["id", "name"],
//       properties: {
//         id: {
//           bsonType: "int",
//           description: "Id of the ansatz"
//         },
//         name: {
//           bsonType: "string",
//           description: "Name of the ansatz"
//         }
//       }
//     }
//   }
// });

db.createCollection('user', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name", 'passwordHash'],
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

db.createCollection('encodingHistory'); 

// db.createCollection('encodingHistory', {
//   validator: {
//     $jsonSchema: {
//       bsonType: "object",
//       required: ["id", "encoding"],
//       properties: {
//         id: {
//           bsonType: "int",
//           description: "Id of the encoding history"
//         },
//         userId: {
//           bsonType: "int",
//           description: "Id of the user"
//         },
//         encoding: {
//           bsonType: "array",
//           items: {
//             bsonType: "object",
//             required: ["gate", "wires"],
//             properties: {
//               gate: {
//                 bsonType: "string",
//                 description: "Name of the gate"
//               },
//               wires: {
//                 bsonType: "array",
//                 items: {
//                   bsonType: "int"
//                 }
//               },
//               params: {
//                 bsonType: "array",
//                 items: {
//                   anyOf: [{bsonType: "double"}, {bsonType: "int"}, {bsonType: "string"}]
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// });


db.user.insertMany([
  { name: 'Erik', id: 999 , passwordHash: '<PASSWORD>'},
  { name: 'Jakob', id: 25 , passwordHash: '<PASSWORD>'}
]);

db.ansatz.insertMany([
  { name: 'CVNeuralNetLayers', id: 1 },
  { name: 'RandomLayers', id: 2 },
  { name: 'StronglyEntanglingLayers', id: 3 }
]);

db.encodingHistory.insertMany([
  {
    "qubits": 5,
    "gates": [
      {
        "id": "g1",
        "type": "RY",
        "target": [0],
        "params": ["theta_1"],
        "timeStep": 0
      }
    ]
  }
  // old verion 
  // {
  //   id: 1,
  //   userId: 999,
  //   encoding: [
  //       {gate: 'RY', wires: [0], "params": ['theta_1']},
  //       {gate: 'CNO', wires: [0, 1]},
  //       {gate: 'RZ', wires: [1], "params": ['x_1']},
  //       {gate: 'RZ', wires: [1], "params": [0.33]}
  //   ]
  // }
]);