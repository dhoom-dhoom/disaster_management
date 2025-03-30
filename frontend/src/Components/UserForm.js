import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import axios from "axios";
import { 
  Card, CardContent, Typography, TextField, Button, 
  Box, Grid, Container, CircularProgress, Snackbar, Alert,
  Paper, Divider, Chip, IconButton, Tooltip
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WarningIcon from "@mui/icons-material/Warning";
import RefreshIcon from "@mui/icons-material/Refresh";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4f9ff3',
    },
    secondary: {
      main: '#f56565',
    },
    background: {
      default: '#111827',
      paper: '#1f2937',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#d1d5db',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 16px',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #4f9ff3 30%, #38bdf8 90%)',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4f9ff3',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(to bottom right, rgba(31, 41, 55, 0.99), rgba(17, 24, 39, 0.99))',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
};

// Dark-style map
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const center = {
  lat: 20.5937,
  lng: 78.9629,
};

export default function DisasterMap() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [stats, setStats] = useState({ total: 0, severe: 0, moderate: 0 });

  useEffect(() => {
    // Update stats whenever markers change
    const severe = markers.filter(m => m.severity === "severe").length;
    setStats({
      total: markers.length,
      severe: severe,
      moderate: markers.length - severe
    });
  }, [markers]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async () => {
    if (!lat || !lng || !file) {
      setNotification({
        open: true,
        message: "Please provide coordinates and an image.",
        severity: "error"
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("latitude", lat);
    formData.append("longitude", lng);
    formData.append("image", file);

    try {
      const response = await axios.post("http://localhost:8001/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;

      if (!data.display) {
        setNotification({
          open: true,
          message: "This location is not classified as a disaster.",
          severity: "info"
        });
      } else {
        const newMarker = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          severity: data.classification,
          timestamp: new Date().toLocaleString(),
          imageUrl: URL.createObjectURL(file)
        };

        setMarkers([...markers, newMarker]);
        setNotification({
          open: true,
          message: `Disaster reported successfully! (${data.classification})`,
          severity: data.classification === "severe" ? "error" : "warning"
        });
        
        // Reset form
        setLat("");
        setLng("");
        setFile(null);
        setFileName("");
      }
    } catch (error) {
      console.error("Error submitting data", error);
      setNotification({
        open: true,
        message: "Error processing request. Please try again.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const getMarkerIcon = (severity) => {
    return {
      url: severity === "severe" 
        ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png" 
        : "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
      scaledSize: { width: 40, height: 40 }
    };
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box 
        sx={{ 
          minHeight: "100vh",
          background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
          py: 4,
          px: { xs: 2, md: 4 }
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h4" 
              sx={{ 
                backgroundImage: "linear-gradient(45deg, #4f9ff3, #38bdf8)",
                backgroundClip: "text",
                color: "transparent",
                fontWeight: 800,
                letterSpacing: "-0.5px"
              }}
            >
              Disaster Monitoring System
            </Typography>
            
            <Tooltip title="Dark Mode Active">
              <DarkModeIcon sx={{ color: "#4f9ff3" }} />
            </Tooltip>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3, overflow: "visible" }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                    Report Disaster
                  </Typography>
                  
                  <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <TextField
                      label="Latitude"
                      variant="outlined"
                      fullWidth
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="e.g., 20.5937"
                      InputProps={{
                        startAdornment: <LocationOnIcon sx={{ mr: 1, color: "rgba(255, 255, 255, 0.5)" }} />,
                      }}
                    />
                    
                    <TextField
                      label="Longitude"
                      variant="outlined"
                      fullWidth
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      placeholder="e.g., 78.9629"
                      InputProps={{
                        startAdornment: <LocationOnIcon sx={{ mr: 1, color: "rgba(255, 255, 255, 0.5)" }} />,
                      }}
                    />
                    
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        border: "1px dashed rgba(255,255,255,0.3)",
                        "&:hover": {
                          border: "1px dashed rgba(255,255,255,0.5)",
                        }
                      }}
                    >
                      {fileName ? fileName : "Upload Disaster Image"}
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                      fullWidth
                      sx={{
                        py: 1.5,
                        mt: 1
                      }}
                    >
                      {loading ? "Processing..." : "Submit Report"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                    Disaster Statistics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: "center",
                          background: "rgba(79, 159, 243, 0.1)",
                          border: "1px solid rgba(79, 159, 243, 0.2)"
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#4f9ff3" }}>
                          {stats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: "center",
                          background: "rgba(245, 101, 101, 0.1)",
                          border: "1px solid rgba(245, 101, 101, 0.2)"
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#f56565" }}>
                          {stats.severe}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Severe
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          textAlign: "center",
                          background: "rgba(236, 201, 75, 0.1)",
                          border: "1px solid rgba(236, 201, 75, 0.2)"
                        }}
                      >
                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#ecc94b" }}>
                          {stats.moderate}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Moderate
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date().toLocaleTimeString()}
                    </Typography>
                    <Tooltip title="Refresh Data">
                      <IconButton size="small">
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%", minHeight: "600px" }}>
                <CardContent sx={{ p: 0, height: "100%" }}>
                  <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Disaster Map
                    </Typography>
                    
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip 
                        size="small"
                        icon={<WarningIcon sx={{ color: "#f56565" }} />}
                        label="Severe" 
                        sx={{ bgcolor: "rgba(245, 101, 101, 0.1)", border: "1px solid rgba(245, 101, 101, 0.2)" }}
                      />
                      <Chip 
                        size="small"
                        icon={<WarningIcon sx={{ color: "#ecc94b" }} />}
                        label="Moderate" 
                        sx={{ bgcolor: "rgba(236, 201, 75, 0.1)", border: "1px solid rgba(236, 201, 75, 0.2)" }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ height: "calc(100% - 48px)", p: 0 }}>
                    <LoadScript googleMapsApiKey="AIzaSyCcQrmxY2lwqHAnzLr6PaE72U1zsfN2sbg">
                      <GoogleMap 
                        mapContainerStyle={{
                          width: "100%",
                          height: "100%",
                          minHeight: "540px"
                        }} 
                        center={center} 
                        zoom={5}
                        options={{
                          styles: mapStyles,
                          disableDefaultUI: false,
                          zoomControl: true,
                          mapTypeControl: false,
                          streetViewControl: false,
                          fullscreenControl: true
                        }}
                      >
                        {markers.map((marker, index) => (
                          <Marker
                            key={index}
                            position={{ lat: marker.lat, lng: marker.lng }}
                            icon={getMarkerIcon(marker.severity)}
                            onClick={() => handleMarkerClick(marker)}
                            animation={window.google?.maps?.Animation?.DROP}
                          />
                        ))}
                        
                        {selectedMarker && (
                          <InfoWindow
                            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                            onCloseClick={() => setSelectedMarker(null)}
                          >
                            <Box sx={{ p: 1, maxWidth: 240, bgcolor: "#1f2937", color: "white", borderRadius: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <WarningIcon 
                                  sx={{ 
                                    mr: 1, 
                                    color: selectedMarker.severity === "severe" ? "#f56565" : "#ecc94b" 
                                  }} 
                                  fontSize="small" 
                                />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {selectedMarker.severity === "severe" ? "Severe Disaster" : "Moderate Disaster"}
                                </Typography>
                              </Box>
                              
                              <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.7 }}>
                                Lat: {selectedMarker.lat.toFixed(4)}, Lng: {selectedMarker.lng.toFixed(4)}
                              </Typography>
                              
                              <Typography variant="caption" display="block" sx={{ mb: 2, opacity: 0.7 }}>
                                Reported: {selectedMarker.timestamp}
                              </Typography>
                              
                              {selectedMarker.imageUrl && (
                                <Box 
                                  sx={{ 
                                    position: "relative",
                                    mt: 1, 
                                    borderRadius: 1, 
                                    overflow: "hidden",
                                    "&:hover .overlay": {
                                      opacity: 1
                                    }
                                  }}
                                >
                                  <img 
                                    src={selectedMarker.imageUrl} 
                                    alt="Disaster" 
                                    style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} 
                                  />
                                  <Box 
                                    className="overlay"
                                    sx={{ 
                                      position: "absolute", 
                                      top: 0, 
                                      left: 0, 
                                      right: 0, 
                                      bottom: 0, 
                                      bgcolor: "rgba(0,0,0,0.5)", 
                                      display: "flex", 
                                      alignItems: "center", 
                                      justifyContent: "center",
                                      opacity: 0,
                                      transition: "opacity 0.2s"
                                    }}
                                  >
                                    <IconButton size="small" sx={{ color: "white" }}>
                                      <VisibilityIcon />
                                    </IconButton>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}