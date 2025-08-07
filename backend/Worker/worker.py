import ast
import pika
import os
import time
import json

from typing import Union

from benchmark import run_benchmark

# Queue names
TASK_QUEUE = 'task_queue'
RESULT_QUEUE = 'result_queue'

# Load RabbitMQ connection parameters from environment variables
USER = os.getenv("RABBITMQ_USER", "erik")
PASSWORD = os.getenv("RABBITMQ_PASS", "erik")
HOST = os.getenv("RABBITMQ_HOST", "host.docker.internal")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))


EPOCH_COUNT   = int(os.getenv("EPOCH_COUNT", "100"))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", "0.2"))
LAYER_COUNT   = int(os.getenv("LAYER_COUNT", "10"))

# Set up RabbitMQ connection credentials and parameters
credentials = pika.PlainCredentials(USER, PASSWORD)
params = pika.ConnectionParameters(
    host=HOST,
    port=PORT,
    credentials=credentials,
    heartbeat=60,
    connection_attempts=5,
    retry_delay=5,
)

run_id: Union[str, None] = None

# Establish connection to RabbitMQ server
try:
    connection = pika.BlockingConnection(params)
except Exception as e:
    print(f"Failed to connect to RabbitMQ: {e}", flush=True)
    time.sleep(10)
    exit(1)

# Set up communication channels and declare queues
channel = connection.channel()
channel.queue_declare(queue=TASK_QUEUE, durable=True)
channel.queue_declare(queue=RESULT_QUEUE, durable=True)


def send_result(message: dict):
    """
    Sends a result message to the RESULT_QUEUE in RabbitMQ.

    :param message: A dictionary containing result data (e.g., task ID, status, progress).
    """
    body = json.dumps(message)
    channel.basic_publish(
        exchange='',
        routing_key=RESULT_QUEUE,
        body=body.encode(),
        properties=pika.BasicProperties(delivery_mode=2)  # Make message persistent
    )


def send_progress(epoch_index: int, epoch_count: int):
    progress_percentage = (epoch_index + 1) / epoch_count
    send_result({'id': globals()["run_id"] , 'status': 'progress', 'progress': progress_percentage})


def callback(ch, method, properties, body):
    """
    Callback function that is triggered when a new message is received from the task queue.
    It simulates a long-running task by sleeping and periodically sending progress updates.

    :param ch: The channel object.
    :param method: Delivery method from RabbitMQ.
    :param properties: Message properties.
    :param body: The raw message body (task ID expected).
    """
    message = body.decode()
    message_dict = ast.literal_eval(message)
    run_id = message_dict["run_id"]
    encoding_id = message_dict["encoding_id"]
    ansatz_id = message_dict["ansatz_id"]
    data_id = message_dict["data_id"]
    measure_index = message_dict["measure_index"]
    qubit_count = message_dict["qubit_count"]


    globals()["run_id"] = run_id
    print(f'Get message: {run_id}', flush=True)

    # Send initial status
    send_result({'id': run_id, 'status': 'init'})
    
    try:
        benchmark_result = run_benchmark(
            ansatz_id       = int(ansatz_id),
            dataset_id      = int(data_id),
            encoding_id     = int(encoding_id),
            n_qubits        = int(qubit_count) or 5,
            measure_wire    = measure_index,
            n_epochs        = EPOCH_COUNT,
            learning_rate   = LEARNING_RATE,
            n_layers        = LAYER_COUNT,
            progress_update = send_progress
        )
        print(benchmark_result, flush=True)

        # Send final status
        result = {
            "run_id":       globals()["run_id"],
            "encoding_id":  encoding_id,
            "ansatz_id":    ansatz_id,
            "data_id":      data_id,
            "loss":         benchmark_result["loss"],
            "accuracy":     benchmark_result["accuracy"],
        }
        print(result, flush=True)
        send_result({
            'id':     globals()["run_id"],
            'status': 'done',
            'result': result
        })

        print(f'Finished {message}', flush=True)

        # Acknowledge message receipt and processing
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        ch.basic_nack(delivery_tag=method.delivery_tag)
        print(f'Failed with exception {e = }.')
        raise e


# Ensure one task is delivered and processed at a time (fair dispatch)
channel.basic_qos(prefetch_count=1)

# Start consuming messages from the task queue
channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback)

print(f'Wait for tasks...', flush=True)
channel.start_consuming()
