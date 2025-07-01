import pika
import threading
import time

# Constants
TASK_QUEUE = 'task_queue'
USER = 'erik'
PASSWORD = 'erik'

def producer():
    """
    Simulates a task producer that sends 10 messages to the TASK_QUEUE.
    Each message represents a task and is sent with a short delay.
    """
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
                delivery_mode=2,  # Make message persistent
            )
        )
        print(f'Producer: Task {i+1} sent')
        time.sleep(0.5)  # Simulate time between sending tasks

    connection.close()
    print("Producer: All tasks have been sent!")

def worker(worker_id):
    """
    Simulates a task consumer (worker) that listens to the TASK_QUEUE and processes tasks.
    Each worker waits for messages, processes them, and sends acknowledgments.

    :param worker_id: An integer ID to distinguish multiple workers.
    """
    credentials = pika.PlainCredentials(USER, PASSWORD)
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost', credentials=credentials))
    channel = connection.channel()
    channel.queue_declare(queue=TASK_QUEUE, durable=True)

    def callback(ch, method, properties, body):
        """
        Callback function that handles incoming messages from the queue.
        Simulates work by sleeping for 2 seconds per task.

        :param ch: Channel
        :param method: Delivery method
        :param properties: Message properties
        :param body: Message content (task)
        """
        message = body.decode()
        print(f'Worker {worker_id}: working on {message}')
        time.sleep(2)  # Simulate work
        print(f'Worker {worker_id}: Finished {message}')
        ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge message

    channel.basic_qos(prefetch_count=1)  # Ensure fair task distribution
    channel.basic_consume(queue=TASK_QUEUE, on_message_callback=callback)

    print(f'Worker {worker_id}: Waiting for tasks...')
    channel.start_consuming()  # Start listening for tasks

# Start producer in separate thread
producer_thread = threading.Thread(target=producer)
producer_thread.start()

# Start two worker threads to process tasks
worker1_thread = threading.Thread(target=worker, args=(1,))
worker2_thread = threading.Thread(target=worker, args=(2,))
worker1_thread.start()
worker2_thread.start()

# Wait until producer has sent all tasks
producer_thread.join()

# Note: Workers run indefinitely; join() will block forever unless they are stopped manually
worker1_thread.join()
worker2_thread.join()