from fastapi import FastAPI, File, UploadFile, Form
import torch
import torchvision.transforms as transforms
import torchvision.models as models
import torch.nn.functional as F
from PIL import Image
import io
# from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# ✅ Allow requests from frontend
# ✅ Update CORS settings
# app.add_middleware
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # React frontend origin
#     allow_credentials=True,
#     allow_methods=["*"],  # Allow all HTTP methods
#     allow_headers=["*"],  # Allow all headers
# )

# ✅ Load Model
model_path = "C:/Users/ashva/OneDrive/Desktop/disaster/resnet50_disaster.pth"  # Update path if needed
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet50(pretrained=False)
class_to_idx = {
    'Infrastructure': 0, 'Urban_Fire': 1, 'Wild_Fire': 2, 'Human_Damage': 3,
    'Drought': 4, 'Land_Slide': 5, 'Non_Damage_Buildings_Street': 6, 
    'Non_Damage_Wildlife_Forest': 7, 'human': 8
}
idx_to_class = {v: k for k, v in class_to_idx.items()}
num_classes = len(class_to_idx)

model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(torch.load(model_path, map_location=device))
model.to(device)
model.eval()

# ✅ Define Transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ✅ Prediction Function
def classify_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(image)
        probabilities = F.softmax(output, dim=1)
        confidence, predicted_class = torch.max(probabilities, 1)

    predicted_label = idx_to_class[predicted_class.item()]
    return predicted_label, confidence.item()

# ✅ API Endpoint
@app.post("/classify")
async def classify_image_api(latitude: float = Form(...), longitude: float = Form(...), image: UploadFile = File(...)):
    image_bytes = await image.read()
    label, confidence = classify_image(image_bytes)

    # Categories to exclude from the map
    exclude_classes = {'Non_Damage_Buildings_Street', 'Non_Damage_Wildlife_Forest', 'human'}
    
    if label in exclude_classes:
        return {"display": False}  # Do not display this point

    severity = "severe" if confidence > 0.6 else "non-severe"
    
    return {
        "display": True,
        "latitude": latitude,
        "longitude": longitude,
        "classification": severity,
        "confidence": confidence,
        "label": label  # Returning the disaster category
    }

