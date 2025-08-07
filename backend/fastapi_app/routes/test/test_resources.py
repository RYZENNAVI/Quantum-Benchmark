from unittest               import TestCase, mock
from os                     import environ

from testcontainers.mongodb import MongoDbContainer
from fastapi                import FastAPI, status
from fastapi.testclient     import TestClient

from ...routes.resource     import router as resource_router
from ...db                  import get_db

app = FastAPI()
app.include_router(resource_router, prefix="/api")
client = TestClient(app)

def mock_env(**kwargs):
    return mock.patch.dict(environ, {str(k): str(v) for k, v in kwargs.items()}, clear=True)

class ResourcesRouteTest(TestCase):
    def _seed(self, db):
        db.encodings.insert_one({"id": 1, "name": "Enc", "description": "", "depth": 1})
        db.ansaetze.insert_one({"id": 2, "name": "Anz", "description": "", "depth": 2})
        db.referenceData.insert_one({"id": 3, "name": "Data", "description": "", "depth": 0})

    def test_get_all_resources(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._seed(db)
            resp = client.get('/api/resources')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            body = resp.json()
            self.assertIn('encodings', body)
            self.assertIn('ansaetze', body)

    def test_get_collection_resources(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._seed(db)
            resp = client.get('/api/resources/encodings')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            body = resp.json()
            self.assertGreaterEqual(len(body['encodings']), 1)

    def test_post_specific_resources(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._seed(db)
            payload = {
                "encoding_ids": [1],
                "ansatz_ids": [2],
                "dataset_ids": [],
                "full": False
            }
            resp = client.post('/api/resources', json=payload)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            body = resp.json()
            self.assertIn('1', body['encodings'])

    def test_post_full_true(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._seed(db)
            payload = {"encoding_ids": [1], "ansatz_ids": [2], "dataset_ids": [], "full": True}
            resp = client.post('/api/resources', json=payload)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            body = resp.json()
            # full=True returns detailed dict for ids
            self.assertEqual(body['encodings']['1']['name'], 'Enc') 