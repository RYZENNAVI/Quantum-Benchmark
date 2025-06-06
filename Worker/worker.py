import pika
import os
import time

# Global
TASK_QUEUE = 'task_queue'
USER = 'erik'
PASSWORD = 'erik'
HOST = 'localhost'

credentials = pika.PlainCredentials(USER, PASSWORD)
connection = pika.BlockingConnection(pika.ConnectionParameters(HOST, credentials=credentials))
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