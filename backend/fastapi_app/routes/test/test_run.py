from unittest               import TestCase, mock
from os                     import environ

from testcontainers.mongodb import MongoDbContainer
from fastapi                import FastAPI, status
from fastapi.testclient     import TestClient

from ...routes.run          import router
from ...db                  import get_db
from ...rabbitmq            import rabbitmq

app = FastAPI()
app.include_router(router, prefix="/api")

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def mock_env(**kwargs):
    return mock.patch.dict(environ, {str(k): str(v) for k, v in kwargs.items()}, clear=True)

# Dummy send_message to bypass real RabbitMQ ---------------------------------
class _DummyMQ:
    def send_message(self, *_args, **_kwargs):
        # pretend everything is fine
        return True

dummy_mq = _DummyMQ()

class RunRouteTest(TestCase):

    def test_create_single_and_get_delete(self):
        with MongoDbContainer('mongo:8.0') as mongodb, \
             mock_env(MONGO_URI=mongodb.get_connection_url()), \
             mock.patch.object(rabbitmq, 'send_message', dummy_mq.send_message):

            # ---------------- CREATE -------------------
            body = {
                "encoding_id": 1,
                "ansatz_id": 2,
                "data_id": 3
            }
            resp = client.post('/api/run', json=body)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            run_id = resp.json()['id']
            self.assertIsInstance(run_id, int)

            # ---------------- GET BY ID ----------------
            resp = client.get(f'/api/run/{run_id}')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertEqual(resp.json()['encoding_id'], 1)

            # ---------------- LIST ---------------------
            resp = client.get('/api/run')
            self.assertEqual(len(resp.json()), 1)

            # ---------------- DELETE -------------------
            # need object_id, first fetch list
            obj_id = get_db().benchmarkRuns.find_one({'id': run_id})['_id']
            resp = client.delete(f'/api/run/{obj_id}')
            self.assertEqual(resp.status_code, status.HTTP_200_OK)

            # verify deletion
            resp = client.get(f'/api/run/{run_id}')
            self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_multi(self):
        with MongoDbContainer('mongo:8.0') as mongodb, \
             mock_env(MONGO_URI=mongodb.get_connection_url()), \
             mock.patch.object(rabbitmq, 'send_message', dummy_mq.send_message):

            body = {
                "encoding_id": [1, 2],
                "ansatz_id": [3],
                "data_id": [4, 5]
            }
            resp = client.post('/api/run', json=body)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            # Should have created 4 combinations
            runs = list(get_db().benchmarkRuns.find())
            self.assertEqual(len(runs), 4)

    def test_invalid_body(self):
        with MongoDbContainer('mongo:8.0') as mongodb, \
             mock_env(MONGO_URI=mongodb.get_connection_url()), \
             mock.patch.object(rabbitmq, 'send_message', dummy_mq.send_message):

            body = {"encoding_id": "not_int", "ansatz_id": 2, "data_id": 3}
            resp = client.post('/api/run', json=body)
            self.assertEqual(resp.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

    def test_send_failure(self):
        """If all send_message calls fail, endpoint should return 500."""
        def _raise(*_a, **_k):
            raise Exception("mq down")

        with MongoDbContainer('mongo:8.0') as mongodb, \
             mock_env(MONGO_URI=mongodb.get_connection_url()), \
             mock.patch('fastapi_app.routes.run.rabbitmq.send_message', _raise):

            body = {"encoding_id": 1, "ansatz_id": 2, "data_id": 3}
            resp = client.post('/api/run', json=body)
            self.assertEqual(resp.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_get_nonexistent_run(self):
        with MongoDbContainer('mongo:8.0') as mongodb, mock_env(MONGO_URI=mongodb.get_connection_url()):
            resp = client.get('/api/run/999')
            self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND) 