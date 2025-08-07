from unittest               import TestCase, mock
from os                     import environ

from testcontainers.mongodb import MongoDbContainer
from fastapi                import FastAPI, status
from fastapi.testclient     import TestClient

from ...routes.result       import router as result_router
from ...db                  import get_db

app = FastAPI()
app.include_router(result_router, prefix="/api")
client = TestClient(app)

# ---------------------------------------------------------------------------

def mock_env(**kwargs):
    return mock.patch.dict(environ, {str(k): str(v) for k, v in kwargs.items()}, clear=True)

class ResultRouteTest(TestCase):

    def _insert_ref_docs(self, db):
        db.encodings.insert_one({"id": 1, "depth": 1, "name": "enc1", "description": "desc"})
        db.ansaetze.insert_one({"id": 2, "depth": 2, "name": "anz1", "description": "desc"})

    def test_create_and_get(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._insert_ref_docs(db)

            payload = {
                "run_id": 10,
                "encoding_id": 1,
                "ansatz_id": 2,
                "data_id": 3,
                "loss": 0.12,
                "accuracy": 0.88
            }
            resp = client.post('/api/result', json=payload)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            obj_id = resp.json()['id']

            # list all
            resp = client.get('/api/result')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            body = resp.json()
            self.assertEqual(len(body['results']), 1)
            self.assertIn('encodings', body)
            self.assertIn('ansaetze', body)

            # get by run id
            resp = client.get('/api/result/10')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertEqual(resp.json()['run_id'], 10)

            # delete
            resp = client.delete(f'/api/result/{obj_id}')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            resp = client.get('/api/result/10')
            self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_object_id(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            resp = client.delete('/api/result/not_an_id')
            self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_result(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._insert_ref_docs(db)

            payload = {
                "run_id": 20,
                "encoding_id": 1,
                "ansatz_id": 2,
                "data_id": 3,
                "loss": 0.3,
                "accuracy": 0.7
            }
            resp = client.post('/api/result', json=payload)
            obj_id = resp.json()['id']

            update_payload = payload.copy()
            update_payload["loss"] = 0.1
            resp = client.put(f'/api/result/{obj_id}', json=update_payload)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

            resp = client.get('/api/result/20')
            self.assertAlmostEqual(resp.json()['loss'], 0.1)

    def test_list_skips_legacy(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            db = get_db()
            self._insert_ref_docs(db)

            # legacy doc without run_id
            db.benchmarkResults.insert_one({
                "encoding_id": 99,
                "ansatz_id": 99,
                "data_id": 99,
                "loss": 1,
                "accuracy": 1
            })

            # proper doc
            payload = {"run_id": 30, "encoding_id": 1, "ansatz_id": 2, "data_id": 3, "loss": 0.2, "accuracy": 0.8}
            client.post('/api/result', json=payload)

            resp = client.get('/api/result')
            self.assertEqual(len(resp.json()['results']), 1) 