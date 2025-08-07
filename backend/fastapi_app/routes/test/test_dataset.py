from unittest               import TestCase, mock
from os                     import environ

from testcontainers.mongodb import MongoDbContainer
from fastapi                import FastAPI, status
from fastapi.testclient     import TestClient

from ...routes.dataset      import router
from ...db                  import get_db
from ...models              import ReferenceData

app = FastAPI()
app.include_router(router, prefix="/api")

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def mock_env(**kwargs):
    return mock.patch.dict(environ, {str(k): str(v) for k, v in kwargs.items()}, clear=True)

# Minimal valid ReferenceData payload ------------------------------------------------
valid_reference_data = {
    "encodings": {},
    "ansaetze": {},
    "data": {
        "0": {
            "depth": 0,
            "name": "Sample dataset",
            "description": "test"
        }
    }
}

class DatasetRouteTest(TestCase):

    def test_dataset_crud(self):
        """Full create -> get -> list -> update -> delete cycle."""
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI=mongodb.get_connection_url()):

                # ---------------------- CREATE ----------------------------
                response = client.post('/api/dataset', json=valid_reference_data)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                doc_id = response.json().get('id')
                self.assertIsNotNone(doc_id)

                # ---------------------- GET BY ID -------------------------
                response = client.get(f'/api/dataset/{doc_id}')
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.json()['data']['data']['0']['name'], 'Sample dataset')

                # ---------------------- LIST ALL --------------------------
                response = client.get('/api/dataset')
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(len(response.json()), 1)

                # ---------------------- UPDATE ----------------------------
                updated_payload = valid_reference_data.copy()
                updated_payload['data']['0']['description'] = 'updated desc'
                response = client.put(f'/api/dataset/{doc_id}', json=updated_payload)
                self.assertEqual(response.status_code, status.HTTP_200_OK)

                # Verify update
                response = client.get(f'/api/dataset/{doc_id}')
                self.assertEqual(response.json()['data']['data']['0']['description'], 'updated desc')

                # ---------------------- DELETE ----------------------------
                response = client.delete(f'/api/dataset/{doc_id}')
                self.assertEqual(response.status_code, status.HTTP_200_OK)

                # Verify deletion
                response = client.get(f'/api/dataset/{doc_id}')
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dataset_invalid_id(self):
        """Requesting an invalid ObjectId should return 400."""
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI=mongodb.get_connection_url()):
                response = client.get('/api/dataset/not_a_valid_id')
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_dataset_invalid_payload(self):
        """Submitting an empty body should raise 422 validation error."""
        with MongoDbContainer('mongo:8.0') as mongodb:
            with mock_env(MONGO_URI=mongodb.get_connection_url()):
                resp = client.post('/api/dataset', json={})
                self.assertEqual(resp.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY) 