from unittest               import TestCase, mock
from os                     import environ

from testcontainers.mongodb import MongoDbContainer
from fastapi                import FastAPI, status
from fastapi.testclient     import TestClient

from ...routes.encoding     import router, CreateResponse
from ...db                  import get_db


app = FastAPI()
app.include_router(router)

client = TestClient(app)


mongodb = MongoDbContainer()


def mock_env(**kwargs):
    return mock.patch.dict(environ, { str(k): str(v) for k, v in kwargs.items() }, clear = True)


encoding_create_valid_request = {
    'name':  'Valid circuit',
    'circuit': [
        {
            'gate':   'RX',
            'wires':  [0],
            'params': [f'input_0']
        },
        {
            'gate':   'RY',
            'wires':  [1],
            'params': [10]
        },
        {
            'gate':   'RZ',
            'wires':  [2],
            'params': [3.1415]
        }
    ],
}

invalid_circuit_requests = [
    {
        'name': 'Negative wire index',
        'circuit': [
            {
                'gate':   'RZ',
                'wires':  [-1],
                'params': [3.1415]
            }
        ]
    },
    {
        'name': 'Wrong param format',
        'circuit': [
            {
                'gate':   'RZ',
                'wires':  [0],
                'params': ['theta_1']
            }
        ]
    },
    {
        'name': 'Wrong gate name',
        'circuit': [
            {
                'gate':   'MYCOOLGATE',
                'wires':  [0],
                'params': [42]
            }
        ]
    }
]


class EncodingRouteTest(TestCase):

    def test_encoding_request_required(self):
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI = mongodb.get_connection_url()):
                response = client.post('/encoding', json = encoding_create_valid_request)
                self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_encoding_request_extra(self):
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI = mongodb.get_connection_url()):
                qubit_count = 8

                response = client.post('/encoding', json = {
                    'name':  'RY single layer',
                    'circuit': [
                        {
                            'gate':            'RZ',
                            'wires':          [i],
                            'params':          [f'input_{i}'],
                            '_frontendgateid': 11833
                        } for i in range(qubit_count)
                    ],
                    'qubit_count': qubit_count,
                })


                self.assertEqual(response.status_code, status.HTTP_200_OK)

                body = CreateResponse(**response.json())

                self.assertIsNotNone(body.id)
                self.assertTrue(body.valid)
                self.assertEqual(body.errors, [])


    def test_encoding_create_invalid_circuit(self):
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI = mongodb.get_connection_url()):
                for json in invalid_circuit_requests:
                    response = client.post('/encoding', json = json)
                    self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

                    body = CreateResponse(**response.json())

                    self.assertIsNone(body.id)
                    self.assertFalse(body.valid)
                    self.assertGreater(len(body.errors), 0)


    def test_encoding_get_all(self):
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI = mongodb.get_connection_url()):
                db = get_db()
                db.encodings.delete_many(dict())

                for _ in range(3):
                    client.post('/encoding', json = encoding_create_valid_request)

                response = client.get('/encoding')

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(len(response.json()), 3)


    def test_encoding_get_by_id(self):
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI = mongodb.get_connection_url()):
                response = client.post('/encoding', json = encoding_create_valid_request)
                id       = response.json()['id']

                response = client.get(f'/encoding/{id}')
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.json()['name'], encoding_create_valid_request['name'])


    def test_encoding_delete_by_id(self):
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI = mongodb.get_connection_url()):
                response = client.post('/encoding', json = encoding_create_valid_request)
                id       = response.json()['id']

                response = client.delete(f'/encoding/{id}')
                self.assertEqual(response.status_code, status.HTTP_200_OK)

                response = client.get(f'/encoding/{id}')
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

                response = client.delete(f'/encoding/{id}')
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
