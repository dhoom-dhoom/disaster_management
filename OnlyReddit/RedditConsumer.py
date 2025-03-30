from kafka import KafkaConsumer
import json
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import os
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup  # For cleaning HTML
from newspaper import Article, ArticleException
import yake
from groq import Groq  # pip install groq
import json
import firebase_admin
from firebase_admin import credentials, firestore
import json

if not firebase_admin._apps:
    cred = credentials.Certificate("disaster-91a59-firebase-adminsdk-fbsvc-732f5f1265.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Kafka Configuration
KAFKA_TOPIC = "reddit_disasters"
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"

# Load the trained model and tokenizer
# Add path according to your System
model_path = r"C:\Users\SANID\Downloads\Info_Model"
model_path2 = r"C:\Users\SANID\Downloads\_Classes_Model"
model_path3 = r"C:\Users\SANID\Downloads\Severity_Model"

if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model path not found: {model_path}")

if not os.path.exists(model_path2):
    raise FileNotFoundError(f"Model path not found: {model_path2}")

if not os.path.exists(model_path3):
    raise FileNotFoundError(f"Model path not found: {model_path3}")

tokenizer = DistilBertTokenizer.from_pretrained(model_path)
model = DistilBertForSequenceClassification.from_pretrained(model_path)

tokenizer2 = DistilBertTokenizer.from_pretrained(model_path2)
model2 = DistilBertForSequenceClassification.from_pretrained(model_path2)

tokenizer3 = DistilBertTokenizer.from_pretrained(model_path3)
model3 = DistilBertForSequenceClassification.from_pretrained(model_path3)

# Move model to device (GPU if available, otherwise CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

device2 = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model2.to(device2)

device3 = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model3.to(device3)

label_mapping = {
    0: "affected_individuals",
    1: "rescue_volunteering_or_donation_effort",
    2: "other_relevant_information",
    3: "not_humanitarian",
    4: "vehicle_damage",
    5: "injured_or_dead_people",
    6: "infrastructure_and_utility_damage",
    7: "missing_or_found_people"
}

guardian_api_key = "Your API Key"
newsapi_key = "Your API Key"
groq_api_key = "Your API Key"


today = datetime.today().date()
from_date = today - timedelta(days=5)
to_date = today  # Today's date


def extract_keywords(text, max_keywords=5):
    try:
        kw_extractor = yake.KeywordExtractor(lan="en", n=2, dedupLim=0.9, top=max_keywords)
        keywords = kw_extractor.extract_keywords(text)
        return [kw[0] for kw in keywords]
    except Exception:
        return []

def summarize_text(text, groq_api_key):
    try:
        client = Groq(api_key=groq_api_key)
        prompt = (
            "You must not respond in Markdown Language. Only Plain text should be returned. Please provide a concise and informative summary of the following disaster-related text. "
            "Highlight the key points and main takeaways in exactly 300 words, formatted in 3 formal paragraphs, "
            "without any emojis or additional commentary. You must start directly with the content and report the result, not start with 'Here is'\n\n" + text
        )
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""

def generate_strategy(text, groq_api_key):
    try:
        client = Groq(api_key=groq_api_key)
        prompt = (
            "You must not respond in Markdown Language. Only Plain text should be returned. Based on the following disaster-related information, provide a detailed, actionable strategy to "
            "mitigate and manage the disaster. The strategy should include practical steps, resource allocation, "
            "and contingency plans. Format your response as a numbered list of clear, implementable measures, "
            "and do not include any extra commentary or greetings. You must start directly with the content and report the result, not start with 'Here is'\n\n" + text
        )
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""

def generate_label(text, groq_api_key):
    try:
        client = Groq(api_key=groq_api_key)
        prompt = (
            "You must not respond in Markdown Language. Only Plain text should be returned. Based on the following disaster-related content, provide a single word label that best categorizes the disaster. "
            "For example, if the content describes an earthquake, your answer should be 'earthquake'. Output only one word, with no additional text. "
            "You must start directly with the content and report the result, not start with 'Here is'\n\n" + text
        )
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=10
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""

def generate_check(text, groq_api_key):
    try:
        client = Groq(api_key=groq_api_key)
        prompt = (
            "Determine whether the following text contains any disaster-related information. "
            "If it does, output exactly the word Valid. If it does not, output exactly the word None. "
            "Do not output any additional text, punctuation, or commentary.\n\n" + text
        )
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=10
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "None"

def generate_location(text, groq_api_key):
    try:
        client = Groq(api_key=groq_api_key)
        prompt = (
            "Based on the following disaster-related text, determine the specific location mentioned. "
            "If a city is provided, output that country name of that city; if not, output the country name. "
            "Do not output a continent or a region; provide exactly one word, with no additional text, punctuation, or commentary.\n\n" + text
        )
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=10
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "None"



def classify_tweet(tweet):
    # Tokenize the input text
    inputs = tokenizer(tweet, truncation=True, padding="max_length", max_length=128, return_tensors="pt")

    # Move input tensors to the same device as the model
    inputs = {key: value.to(device) for key, value in inputs.items()}

    # Run model inference
    model.eval()
    with torch.no_grad():
        outputs = model(**inputs)

    # Get the predicted class
    predicted_class = torch.argmax(outputs.logits, dim=-1).item()

    # Map prediction back to class names
    class_mapping = {0: "little_or_no_damage", 1: "mild_damage", 2: "severe_damage"}

    return class_mapping[predicted_class]

def generate_random(text, groq_api_key):
    try:
        client = Groq(api_key=groq_api_key)
        prompt = (
            "You must not respond in Markdown Language. Only Plain text should be returned. Based on the following disaster-related input, generate a synthetic news article of approximately 1500 words. "
            "The article should be written in a formal news reporting style and include a detailed narrative of the event with reasonable assumptions. "
            "Incorporate plausible statistics such as casualty numbers, property damage estimates, emergency response details, and economic impacts. "
            "Ensure the article is coherent and logically structured, with a headline, lead, body, and conclusion, and includes specific data points to support the narrative. "
            "The article should be entirely synthetic and self-contained, yet realistic and comprehensive.\n\n" + text
        )
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return "None"


# Function to make predictions
def predict(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding="max_length", max_length=128)
    inputs = {key: value.to(device) for key, value in inputs.items()}  # Move input tensors to same device as model

    model.eval()  # Set model to evaluation mode
    with torch.no_grad():  # Disable gradient calculations (not needed for inference)
        outputs = model(**inputs)

    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=-1).item()

    return "informative" if predicted_class == 1 else "not_informative"

def predict2(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding="max_length", max_length=128)
    inputs = {key: value.to(device) for key, value in inputs.items()}  # Move input tensors to same device as model

    model2.eval()  # Set model to evaluation mode
    with torch.no_grad():  # Disable gradient calculations (not needed for inference)
        outputs = model2(**inputs)

    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=-1).item()

    return label_mapping[predicted_class]


# Initialize Kafka consumer
consumer = KafkaConsumer(
    KAFKA_TOPIC,
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    auto_offset_reset="earliest",  # Start from the beginning of the topic
    value_deserializer=lambda v: json.loads(v.decode("utf-8"))  # Deserialize JSON messages
)

print(f"Listening to Kafka topic: {KAFKA_TOPIC}")

for message in consumer:
    print(message)  # Print the raw Kafka message
    data = message.value  # Assuming data is a dictionary
    
    text = data.get("title", "")  # Extract the "title" field instead of "text"
    
    #print(text)  # Debugging: Check what text is extracted


    if text:
        classification = predict(text)
        print(f"Received message: {text}")
        print(f"Prediction: {classification}")
        if(classification == "informative"):
            classification2 = predict2(text)
            print(f"Which Type: {classification2}")

            classification3 = classify_tweet(text)
            print(f"Severity Measures : {classification3}")
            tit = data.get("title","")
            query = tit
            uu = data.get("url","")
            keywords = extract_keywords(query)
            query2 = ' AND '.join(f'"{keyword}"' for keyword in keywords)
            final_string = ""
            # Guardian API endpoint and parameters
            guardian_url = "https://content.guardianapis.com/search"
            guardian_params = {
                "q": query2,
                "from-date": from_date.strftime("%Y-%m-%d"),
                "to-date": to_date.strftime("%Y-%m-%d"),
                "order-by": "newest",
                "show-fields": "body",  # Fetch full article text
                "page-size": 200,
                "api-key": guardian_api_key
            }

            # Fetch articles from Guardian API
            try:
                guardian_response = requests.get(guardian_url, params=guardian_params, timeout=10)
                if guardian_response.status_code == 200:
                    data = guardian_response.json()
                    articles = data.get("response", {}).get("results", [])
                    for article in articles:
                        try:
                            raw_content = article.get("fields", {}).get("body", "")
                            soup = BeautifulSoup(raw_content, "html.parser")
                            clean_text = soup.get_text(separator="\n")
                            final_string += clean_text + "\n"
                        except Exception:
                            pass
            except Exception:
                pass

            # NewsAPI endpoint and parameters
            newsapi_url = "https://newsapi.org/v2/everything"
            newsapi_params = {
                "apiKey": newsapi_key,
                "q": query,  # Use the original query here
                "from": (datetime.today() - timedelta(days=5)).strftime('%Y-%m-%d'),
                "to": datetime.today().strftime('%Y-%m-%d'),
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 5
            }

            # Fetch articles from NewsAPI
            try:
                newsapi_response = requests.get(newsapi_url, params=newsapi_params, timeout=10)
                if newsapi_response.status_code == 200:
                    try:
                        data = newsapi_response.json()
                        news_articles = data.get("articles", [])
                    except Exception:
                        news_articles = []
                else:
                    news_articles = []
            except Exception:
                news_articles = []

            # Process NewsAPI articles with newspaper3k
            if news_articles:
                for article in news_articles:
                    article_url = article.get('url', '')
                    if article_url:
                        try:
                            article_obj = Article(article_url)
                            article_obj.download()
                            article_obj.parse()
                            final_string += article_obj.text + "\n"
                        except (ArticleException, Exception):
                            pass
            store = ""
            store1 = ""
            store2 = ""
            store3 = ""
            summ = False
            strat = False
            labe = False
            local_n = False
            if final_string.strip():
                check_result = generate_check(final_string, groq_api_key)
                if check_result == "Valid":
                    summary = summarize_text(final_string, groq_api_key)
                    strategy = generate_strategy(final_string, groq_api_key)
                    label = generate_label(final_string, groq_api_key)
                    location = generate_location(final_string, groq_api_key)
                    
                    if summary:
                        summ = True
                        #print("Summary:\n", summary)
                        store = summary
                    if strategy:
                        #print("\nStrategy:\n", strategy)
                        strat = True
                        store1 = strategy
                    if label:   
                        #print("\nLabel:\n", label)
                        labe = True
                        store2 = label
                    if location:
                        #print("\nLocation:\n", location)
                        local_n = True
                        store3 = location
                elif check_result == "None":
                        final_string = generate_random(query, groq_api_key)
                        summary = summarize_text(final_string, groq_api_key)
                        strategy = generate_strategy(final_string, groq_api_key)
                        label = generate_label(final_string, groq_api_key)
                        location = generate_location(final_string, groq_api_key)
                        if summary:
                            summ = True
                        #   print("Summary:\n", summary)
                            store = summary
            
                        if strategy:

                            strat = True
                            store1 = strategy
                            
                        if label:
                            labe = True
                            store2 = label

    
                        if location:
                            local_n = True
                            store3 = location


            else:                       
                final_string = generate_random(query, groq_api_key)
                summary = summarize_text(final_string, groq_api_key)
                strategy = generate_strategy(final_string, groq_api_key)
                label = generate_label(final_string, groq_api_key)
                location = generate_location(final_string, groq_api_key)
                if summary:
                    summ = True
                    store = summary

                if strategy:
                    strat = True
                    store1 = strategy

                if label:
                    labe = True
                    store2 = label

                if location:
                    local_n = True
                    store3 = location

                    


            json_output = json.dumps({
                "title": tit,
                "url": uu,
                "Category" : classification2,
                "Severity" : classification3,
                "Strategy" : store,
                "Summary" : store1,
                "Label" : store2,
                "Location" : store3
            }, indent=4)
            # Convert JSON string to dictionary
            if isinstance(json_output, str):  # Check if it's a string
                json_output = json.loads(json_output)  # Should print <class 'dict'>

            try:
                db.collection("disaster_reports").add(json_output)
                print("Data successfully written to Firestore")
            except Exception as e:
                print(f"Error writing to Firestore: {e}")



            print(json_output)
    else:
        print("Received message without title field, skipping.")



