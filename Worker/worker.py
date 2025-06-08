import pika
import os
import time

# Global
TASK_QUEUE = 'task_queue'
USER = os.getenv("RABBITMQ_USER", "erik")
PASSWORD = os.getenv("RABBITMQ_PASS", "erik")
HOST = os.getenv("RABBITMQ_HOST", "localhost")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))

credentials = pika.PlainCredentials(USER, PASSWORD)
params = pika.ConnectionParameters(
    host=HOST,
    port=PORT,
    credentials=credentials,
    connection_attempts=5,
    retry_delay=5,
)
connection = pika.BlockingConnection(params)
channel = connection.channel()
channel.queue_declare(queue=TASK_QUEUE, durable=True)

def callback(ch, method, properties, body):
    message = body.decode()
    print(f'Get message: {message}')
    time.sleep(2)
    print(f'Finished {message}')
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)  # fair distribution of tasks
channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback)

print(f'Wait for tasks...')
channel.start_consuming()
