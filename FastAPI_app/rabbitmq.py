import os
import pika
from threading import Lock

TASK_QUEUE = 'task_queue'

USER = os.getenv("RABBITMQ_USER", "erik")
PASSWORD = os.getenv("RABBITMQ_PASS", "erik")
HOST = os.getenv("RABBITMQ_HOST", "localhost")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))

class RabbitMQ:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.lock = Lock()

    def connect(self):
        if not self.connection or self.connection.is_closed:
            credentials = pika.PlainCredentials(USER, PASSWORD)
            params = pika.ConnectionParameters(
                host=HOST,
                port=PORT,
                credentials=credentials,
                connection_attempts=5,
                retry_delay=5,
            )
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue=TASK_QUEUE, durable=True)

    def send_message(self, message: str):
        with self.lock:
            if not self.connection or self.connection.is_closed:
                self.connect()
            self.channel.basic_publish(
                exchange='',
                routing_key=TASK_QUEUE,
                body=message.encode(),
                properties=pika.BasicProperties(delivery_mode=2)
            )

    def close(self):
        if self.connection and self.connection.is_open:
            self.connection.close()

rabbitmq = RabbitMQ()
