import pika
import os
import time
import json
import db

# Queue names
TASK_QUEUE = 'task_queue'
RESULT_QUEUE = 'result_queue'

# Load RabbitMQ connection parameters from environment variables
USER = os.getenv("RABBITMQ_USER", "erik")
PASSWORD = os.getenv("RABBITMQ_PASS", "erik")
HOST = os.getenv("RABBITMQ_HOST", "host.docker.internal")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))

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
    task_id = int(message)
    print(f'Get message: {message}', flush=True)

    # Send initial status
    send_result({'id': task_id, 'status': 'init'})

    # Simulate 10 steps of work, sending progress updates
    for i in range(10):
        print(f'Work on step {i + 1}', flush=True)
        time.sleep(2)
        progress = (i + 1) * 10
        send_result({'id': task_id, 'status': 'progress', 'progress': progress})

    # Send final status
    send_result({'id': task_id, 'status': 'done'})
    print(f'Finished {message}', flush=True)

    # Acknowledge message receipt and processing
    ch.basic_ack(delivery_tag=method.delivery_tag)


# Ensure one task is delivered and processed at a time (fair dispatch)
channel.basic_qos(prefetch_count=1)

# Start consuming messages from the task queue
channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback)

print(f'Wait for tasks...', flush=True)
channel.start_consuming()