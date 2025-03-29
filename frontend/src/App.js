import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";

// Add these imports for Material-UI components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField"; // Replace Input with TextField
import Button from "@mui/material/Button";

const containerStyle = {
  width: "100%",
  height: "500px"
};

const center = {
  lat: 20.5937,
  lng: 78.9629, // Default to India
};

export default function DisasterMap() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [file, setFile] = useState(null);
  const [markers, setMarkers] = useState([]);

  const handleSubmit = async () => {
    if (!lat || !lng || !file) {
        alert("Please provide coordinates and an image.");
        return;
    }

    const formData = new FormData();
    formData.append("latitude", lat);
    formData.append("longitude", lng);
    formData.append("image", file);

    try {
        const response = await axios.post("http://localhost:8002/classify", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const data = response.data;

        if (!data.display) {
            alert("This location is not classified as a disaster.");
            return;
        }

        setMarkers([...markers, {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            severity: data.classification
        }]);
    } catch (error) {
        console.error("Error submitting data", error);
    }
};

  return (
    <div className="p-4">
      <Card className="mb-4 p-4">
  <CardContent>
    <div className="flex flex-col gap-2">
      <TextField
        label="Latitude"
        variant="outlined"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
      />
      <TextField
        label="Longitude"
        variant="outlined"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
      />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <Button variant="contained" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  </CardContent>
</Card>

      <LoadScript googleMapsApiKey="AIzaSyCcQrmxY2lwqHAnzLr6PaE72U1zsfN2sbg">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={5}>
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={{
                url: marker.severity === "severe" ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}