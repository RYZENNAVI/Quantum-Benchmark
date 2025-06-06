import pika
import threading
import time

# Global
TASK_QUEUE = 'task_queue'
USER = 'erik'
PASSWORD = 'erik'

def producer():
    credentials = pika.PlainCredentials(USER, PASSWORD)
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost', credentials=credentials))
    channel = connection.channel()
    channel.queue_declare(queue=TASK_QUEUE, durable=True)

    for i in range(10):
        message = f'task {i+1}'
        channel.basic_publish(
            exchange='',
            routing_key=TASK_QUEUE,
            body=message,
            properties=pika.BasicProperties(
                delivery_mode=2, # persistant mode
            )
        )
        print(f'Producer: Task {i+1} sent')
        time.sleep(0.5)

    connection.close()
    print("Producer: All tasks have been sent!")

def worker(worker_id):
    credentials = pika.PlainCredentials(USER, PASSWORD)
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost', credentials=credentials))
    channel = connection.channel()
    channel.queue_declare(queue=TASK_QUEUE, durable=True)

    def callback(ch, method, properties, body):
        message = body.decode()
        print(f'Worker {worker_id}: working on {message}')
        time.sleep(2)
        print(f'Worker {worker_id}: Finished {message}')
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)  # fair distribution of tasks
    channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback)

    print(f'Worker {worker_id}: Wait for tasks...')
    channel.start_consuming()

producer_thread = threading.Thread(target=producer)
producer_thread.start()

worker1_thread = threading.Thread(target=worker, args=(1,))
worker2_thread = threading.Thread(target=worker, args=(2,))
worker1_thread.start()
worker2_thread.start()

producer_thread.join()

#workers work endlessly, the test must finish itself
worker1_thread.join()
worker2_thread.join()