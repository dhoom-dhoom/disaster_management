import time
import json
from datetime import datetime
from atproto import Client
from kafka import KafkaProducer

# Bluesky credentials
USERNAME = "sanid77.bsky.social"
PASSWORD = "nypm-ah2j-iumq-c2wx"

# Kafka settings
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
KAFKA_TOPIC = "bluesky_disaster_posts"

# Initialize Kafka Producer
def create_kafka_producer():
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: str(k).encode('utf-8') if k is not None else None
        )
        print(f"Connected to Kafka at {KAFKA_BOOTSTRAP_SERVERS}")
        return producer
    except Exception as e:
        print(f"Kafka connection error: {e}")
        return None

# Send post to Kafka
def send_to_kafka(producer, post_data):
    try:
        # Use post CID as key for partitioning
        key = post_data.get('CID', str(time.time()))
        
        # Send to Kafka topic
        future = producer.send(KAFKA_TOPIC, key=key, value=post_data)
        record_metadata = future.get(timeout=10)
        
        print(f"Sent to Kafka - Topic: {record_metadata.topic}, "
              f"Partition: {record_metadata.partition}, "
              f"Offset: {record_metadata.offset}")
        return True
    except Exception as e:
        print(f"Error sending to Kafka: {e}")
        return False

def scrape_bluesky_posts():
    # Initialize Bluesky client
    client = Client()
    profile = client.login(USERNAME, PASSWORD)
    print('Welcome,', profile.display_name)

    # Initialize Kafka Producer
    producer = create_kafka_producer()
    if not producer:
        print("Failed to create Kafka producer. Exiting.")
        return

    # Search parameters
    params = {
        "q": "wildfire",
        "limit": 25,
        "sort": 'latest',
        "since": "2025-01-21T00:00:00Z",
        "until": "2025-01-22T00:00:00Z"
    }

    cursor = None
    last = "0"
    entries_fetched = 0

    try:
        for loop in range(200):
            # Update cursor
            if cursor:
                params["cursor"] = cursor
            else:
                cursor = last
                params["cursor"] = cursor
            last = str(int(last) + 25)

            print(f"Loop {loop} started")

            try:
                response = client.app.bsky.feed.search_posts(params)
                print(f"Posts Fetched: {len(response.posts)}")
            except Exception as e:
                print(f"Posts Not Fetched: {e}")
                break

            cursor = response.cursor

            # Fetch profiles for additional metadata
            pa = {
                "actors": [post.author.handle for post in response.posts]
            }
            try:
                pfp_raw = client.app.bsky.actor.get_profiles(pa)
            except Exception as e:
                print(f"Profiles Not Fetched: {e}")
                break

            pfp_raw = pfp_raw.profiles
            pfp = {curr_pfp.handle: curr_pfp for curr_pfp in pfp_raw}

            entries_fetched += min(len(pfp), len(response.posts))

            # Process each post
            for post in response.posts:
                if post.author.handle not in pfp:
                    print(f"{post.author.handle} Not Found in profiles")
                    continue

                # Prepare post data for Kafka
                post_data = {
                    "User_DID": post.author.did,
                    "User_Handle": post.author.handle,
                    "Username": post.author.display_name,
                    "Account_Created_At": post.author.created_at,
                    "Followers": pfp[post.author.handle].followers_count,
                    "Follows": pfp[post.author.handle].follows_count,
                    "Post_Count": pfp[post.author.handle].posts_count,
                    "User_Description": pfp[post.author.handle].description,
                    "Created_At": post.record.created_at,
                    "Text": post.record.text,
                    "Likes": post.like_count,
                    "Quotes": post.quote_count,
                    "Reply_Count": post.reply_count,
                    "Reposts": post.repost_count,
                    "CID": post.cid,
                    "Ingestion_Timestamp": datetime.now().isoformat()
                }

                # Handle images
                try:
                    images = post.embed.images
                    for j in range(1, 5):
                        if j - 1 < len(images):
                            post_data[f"Image{j}"] = images[j - 1].thumb
                            post_data[f"Image{j}_Alt"] = images[j - 1].alt
                        else:
                            post_data[f"Image{j}"] = ""
                            post_data[f"Image{j}_Alt"] = ""
                except Exception:
                    try:
                        # Fallback for other embed types
                        post_data["Image1"] = post.embed.thumbnail
                        post_data["Image1_Alt"] = ""
                    except Exception:
                        post_data["Image1"] = ""
                        post_data["Image1_Alt"] = ""

                # Send to Kafka
                send_to_kafka(producer, post_data)

            # Reset variables
            response = None
            pfp = None

            print(f"Loop {loop} ends with cursor: {params.get('cursor', 0)}")
            time.sleep(3)

        print(f"Total entries fetched: {entries_fetched}")

    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        # Ensure Kafka producer is closed
        if producer:
            producer.flush()
            producer.close()

def main():
    scrape_bluesky_posts()

if __name__ == "__main__":
    main()