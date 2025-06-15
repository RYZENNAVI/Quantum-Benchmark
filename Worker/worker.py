import pika
import os
import time
import db

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
    id = int(message)
    print(f'Get message: {message}')
    db.init_progress(id)
    for i in range(10):
        print(f'"Work on step{i+1}')
        time.sleep(2)
        db.update_progress(id, (i+1)*10)
        print(db.get_progress(id))


    print(f'Finished {message}')
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)  # fair distribution of tasks
channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback)

print(f'Wait for tasks...')
channel.start_consuming()
