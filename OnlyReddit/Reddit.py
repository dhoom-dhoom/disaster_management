import praw
import time
import json
import csv
import os
import re
import urllib.parse
from kafka import KafkaProducer
from datetime import datetime
import requests
import mimetypes

# Directory to store images
IMAGE_DIR = "reddit_images"
os.makedirs(IMAGE_DIR, exist_ok=True)

# Reddit API credentials
REDDIT_CLIENT_ID = "PLsQVvzm4DNB-0No0AH7xA"
REDDIT_CLIENT_SECRET = "wucpYFEvaQ5aga44Ryqo8yKipVVBvA"
REDDIT_USER_AGENT = "Disaster Scraper:v1.0 (by u/ComfortableOld3041)"

# Kafka 
KAFKA_BOOTSTRAP_SERVERS = 'localhost:9092' 
KAFKA_TOPIC = 'reddit_disasters'

# CSV file settings
CSV_FILE = "reddit_disasters.csv"
CSV_HEADERS = ["id", "title", "url", "created_utc", "upvotes", "num_comments", "subreddit", "method", "timestamp", "image_path"]

# Supported image file extensions
IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

# Initialize Kafka producer
try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        key_serializer=lambda k: k.encode('utf-8') if isinstance(k, str) else None
    )
    print(f"Connected to Kafka at {KAFKA_BOOTSTRAP_SERVERS}")
except Exception as e:
    print(f"Failed to connect to Kafka: {e}")
    exit(1)

# Initialize PRAW with read-only mode
reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_CLIENT_SECRET,
    user_agent=REDDIT_USER_AGENT,
    check_for_async=False,
    read_only=True
)

print("Using Reddit in read-only mode")

# Subreddits to scrape
subreddits = ["disaster", "news", "wildfire", "earthquake", "storm", "worldnews", "Weather"]
query = "disaster OR wildfire OR flood OR earthquake OR hurricane"

# Number of posts to fetch per subreddit
num_posts = 50

# Create CSV file and write header if not exists
file_exists = os.path.isfile(CSV_FILE)
with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    if not file_exists:
        writer.writerow(CSV_HEADERS)

def is_image_url(url):
    """Check if the URL points to an image file"""
    parsed_url = urllib.parse.urlparse(url)
    file_extension = os.path.splitext(parsed_url.path)[1].lower()
    return file_extension in IMAGE_EXTENSIONS

def download_image(image_url, post_id):
    """
    Download image from a given URL
    Returns the path of the downloaded image or None if download fails
    """
    try:
        response = requests.get(image_url, stream=True, timeout=10)
        
        # Check if request was successful
        if response.status_code != 200:
            print(f"Failed to download image from {image_url}: HTTP {response.status_code}")
            return None
        
        # Determine file extension
        content_type = response.headers.get('Content-Type', '')
        ext = mimetypes.guess_extension(content_type) or os.path.splitext(urllib.parse.urlparse(image_url).path)[1]
        
        # If no valid extension found, use .jpg as default
        if not ext or ext not in IMAGE_EXTENSIONS:
            ext = '.jpg'
        
        # Create unique filename
        filename = f"{post_id}{ext}"
        image_path = os.path.join(IMAGE_DIR, filename)
        
        # Save the image
        with open(image_path, 'wb') as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)
        
        print(f"Downloaded image: {image_path}")
        return image_path
    
    except Exception as e:
        print(f"Error downloading image from {image_url}: {e}")
        return None

# Function to save data to CSV
def save_to_csv(data):
    with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow([
            data["id"], data["title"], data["url"], data["created_utc"],
            data["upvotes"], data["num_comments"], data["subreddit"], 
            data["method"], data["timestamp"], data.get("image_path", "")
        ])

# Function to send data to Kafka
def send_to_kafka(data, topic=KAFKA_TOPIC):
    key = f"{data['subreddit']}-{data.get('id', datetime.now().timestamp())}"
    
    if not isinstance(key, str):
        key = "unknown-key"

    try:
        future = producer.send(topic, key=key, value=data)
        record_metadata = future.get(timeout=10)
        print(f"Sent to {record_metadata.topic}, partition {record_metadata.partition}, offset {record_metadata.offset}")
        return True
    except Exception as e:
        print(f"Failed to send to Kafka: {e}")
        return False

# Scrape posts
while True:
    try:
        post_count = 0
        image_count = 0

        for subreddit_name in subreddits:
            try:
                print(f"Accessing subreddit: {subreddit_name}")
                sub = reddit.subreddit(subreddit_name)
            
                # Scrape hot posts
                try:
                    for post in sub.hot(limit=num_posts):
                        image_path = None
                        if is_image_url(post.url):
                            image_path = download_image(post.url, post.id)
                            if image_path:
                                image_count += 1
                        
                        post_data = {
                            "id": post.id,
                            "title": post.title,
                            "url": post.url,
                            "created_utc": post.created_utc,
                            "upvotes": post.score,
                            "num_comments": post.num_comments,
                            "subreddit": post.subreddit.display_name,
                            "method": "hot",
                            "timestamp": datetime.now().isoformat(),
                            "image_path": image_path or ""
                        }
                        
                        save_to_csv(post_data)
                        if send_to_kafka(post_data):
                            post_count += 1
                            print(f"Added hot post: {post.title[:30]}...")

                        time.sleep(0.5)
                    
                except Exception as e:
                    print(f"Error fetching hot posts in {subreddit_name}: {e}")
                    
                # Scrape search posts
                try:
                    for post in sub.search(query, limit=num_posts, sort='new'):
                        image_path = None
                        if is_image_url(post.url):
                            image_path = download_image(post.url, post.id)
                            if image_path:
                                image_count += 1
                        
                        post_data = {
                            "id": post.id,
                            "title": post.title,
                            "url": post.url,
                            "created_utc": post.created_utc,
                            "upvotes": post.score,
                            "num_comments": post.num_comments,
                            "subreddit": post.subreddit.display_name,
                            "method": "search",
                            "timestamp": datetime.now().isoformat(),
                            "image_path": image_path or ""
                        }
                        
                        save_to_csv(post_data)
                        if send_to_kafka(post_data):
                            post_count += 1
                            print(f"Added search post: {post.title[:30]}...")

                        time.sleep(1)
                        
                except Exception as e:
                    print(f"Error during search in {subreddit_name}: {e}")
                    
            except Exception as e:
                print(f"Error accessing {subreddit_name}: {e}")

        producer.flush()
        
        print(f"Scraping complete. Saved {post_count} posts to CSV, downloaded {image_count} images, and sent them to Kafka topic '{KAFKA_TOPIC}'.")
        
        # Wait before the next iteration
        print("Waiting for the next iteration...")
        time.sleep(60)  # Wait for 1 minute before scraping again
        
    except Exception as e:
        print(f"Unexpected error: {e}")

