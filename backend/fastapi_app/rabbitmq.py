import os
import pika
import json
import threading
from threading import Lock
import db

# Constants for RabbitMQ queues
TASK_QUEUE = 'task_queue'
RESULT_QUEUE = 'result_queue'

# Environment variables for RabbitMQ connection credentials and host
USER = os.getenv("RABBITMQ_USER", "erik")
PASSWORD = os.getenv("RABBITMQ_PASS", "erik")
HOST = os.getenv("RABBITMQ_HOST", "localhost")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))

class RabbitMQ:
    """
    RabbitMQ producer and result consumer handler for task queue management.

    This class manages connection to RabbitMQ, sending messages (tasks) to a task queue,
    and consuming messages (results) from a result queue.

    It handles connection setup, reconnection on failures, thread-safe channel access,
    and processing of results to update a database via imported 'db' module.
    """

    def __init__(self):
        """
        Initialize RabbitMQ client with no connection or channel.
        Also initializes a thread lock for thread safety and consumer thread placeholder.
        """
        self.connection = None
        self.channel = None
        self.lock = Lock()
        self.consumer_thread = None

    def connect(self):
        """
        Establish a connection and channel to RabbitMQ if not already connected.
        Declares both the task and result queues as durable.

        Raises:
            pika.exceptions.AMQPConnectionError: If connection cannot be established.
        """
        # Return early if already connected and channel open
        if self.connection and self.connection.is_open and self.channel and self.channel.is_open:
            return

        print("[~] Connecting to RabbitMQ...", flush=True)

        # Setup connection parameters with credentials and retry/timeout settings
        credentials = pika.PlainCredentials(USER, PASSWORD)
        params = pika.ConnectionParameters(
            host=HOST,
            port=PORT,
            credentials=credentials,
            heartbeat=60,
            blocked_connection_timeout=10,
            connection_attempts=3,
            retry_delay=3,
        )

        try:
            # Establish blocking connection and open a channel
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            # Declare queues as durable to survive RabbitMQ restarts
            channel.queue_declare(queue=TASK_QUEUE, durable=True)
            channel.queue_declare(queue=RESULT_QUEUE, durable=True)

            # Thread-safe assignment of connection and channel
            with self.lock:
                self.connection = connection
                self.channel = channel

            print("[+] Connected to RabbitMQ.", flush=True)

        except pika.exceptions.AMQPConnectionError as e:
            print(f"[!] Connection failed: {e}", flush=True)
            raise

    def reconnect(self):
        """
        Reconnect by closing existing connection and creating a new one.
        """
        print("[!] Reconnecting...", flush=True)
        self.close()
        self.connect()

    def send_message(self, message: str, max_retries=3):
        """
        Send a task message (task_id as string) to the TASK_QUEUE with retries.

        Args:
            task_id (str): The unique identifier for the task to send.
            max_retries (int): Number of times to retry sending on failure (default: 3).

        This method ensures thread safety and reconnects on failures.
        """
        attempt = 0

        while attempt < max_retries:
            try:
                self.connect()
                with self.lock:
                    if not self.channel or self.channel.is_closed:
                        raise pika.exceptions.AMQPChannelError("Channel is closed")
                    # Publish message persistently
                    self.channel.basic_publish(
                        exchange='',
                        routing_key=TASK_QUEUE,
                        body=message.encode(),
                        properties=pika.BasicProperties(delivery_mode=2)  # Persistent delivery
                    )
                    print(f"[x] Sent task {message}", flush=True)
                    return  # Success, exit method

            except pika.exceptions.AMQPError as e:
                print(f"[!] send_message failed (attempt {attempt + 1}): {e}", flush=True)
                self.reconnect()
                attempt += 1

            except Exception as e:
                print(f"[!] Unexpected error (attempt {attempt + 1}): {e}", flush=True)
                self.reconnect()
                attempt += 1

        print(f"[!] Failed to send task {message} after {max_retries} attempts", flush=True)

    def start_result_consumer(self):
        """
        Start a background thread consuming results from RESULT_QUEUE.

        The consumer updates the progress in the database depending on message status:

        - 'init': initializes progress for the task
        - 'progress': updates current progress percentage
        - 'done': marks task as finished

        This method ensures only one consumer thread runs at a time.
        """

        if self.consumer_thread and self.consumer_thread.is_alive():
            # Consumer already running
            return

        def callback(ch, method, properties, body):
            """
            Callback executed on receiving a message from RESULT_QUEUE.

            Parses the JSON message and updates the database accordingly.
            Acknowledges message on success, negative-acknowledges on failure without requeue.
            """
            try:
                message = json.loads(body.decode())
                task_id = message.get("id")
                status = message.get("status")
                result = message.get("result")

                if status == "init":
                    db.init_progress(task_id)
                elif status == "progress":
                    db.update_progress(task_id, message.get("progress", 0))
                elif status == "done":
                    db.set_result(result)
                    db.finished_progress(task_id)
                else:
                    print(f"[!] Unknown status: {status}", flush=True)

                print(f"[{status}] Task {task_id} → {db.get_benchmarkRuns(task_id)}", flush=True)
                ch.basic_ack(delivery_tag=method.delivery_tag)

            except Exception as e:
                print(f"[!] Callback error: {e}", flush=True)
                # Reject message and do not requeue
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        def consume():
            """
            Consume messages from RESULT_QUEUE in a blocking loop.

            Declares the queue durable, sets prefetch to 1 to handle one message at a time.
            """
            try:
                credentials = pika.PlainCredentials(USER, PASSWORD)
                params = pika.ConnectionParameters(
                    host=HOST,
                    port=PORT,
                    credentials=credentials,
                    heartbeat=60,
                    blocked_connection_timeout=10,
                    connection_attempts=3,
                    retry_delay=3,
                )
                connection = pika.BlockingConnection(params)
                result_channel = connection.channel()
                result_channel.queue_declare(queue=RESULT_QUEUE, durable=True)
                result_channel.basic_qos(prefetch_count=1)
                result_channel.basic_consume(queue=RESULT_QUEUE, on_message_callback=callback)
                print("[Consumer] Waiting for result messages...", flush=True)
                result_channel.start_consuming()
            except pika.exceptions.AMQPError as e:
                print(f"[!] Consumer error: {e}", flush=True)

        # Start consumer thread as a daemon so it does not block program exit
        self.consumer_thread = threading.Thread(target=consume, daemon=True)
        self.consumer_thread.start()

    def close(self):
        """
        Close the channel and connection to RabbitMQ safely with lock protection.
        """
        with self.lock:
            try:
                if self.channel and self.channel.is_open:
                    self.channel.close()
            except Exception:
                pass
            try:
                if self.connection and self.connection.is_open:
                    self.connection.close()
            except Exception:
                pass

# Instantiate the RabbitMQ helper object
rabbitmq = RabbitMQ()
