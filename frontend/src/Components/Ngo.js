// App.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, Polyline, InfoWindow } from '@react-google-maps/api';
import { FaLayerGroup, FaRoute, FaInfoCircle, FaHandHoldingHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Ngo.css';

const API_URL = 'http://localhost:8002';
const GOOGLE_MAPS_API_KEY = 'AIzaSyCcQrmxY2lwqHAnzLr6PaE72U1zsfN2sbg';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Dark mode map style
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const center = {
  lat: 28.65,
  lng: 77.15
};

function NgoPortal() {
  const [disasterPoints, setDisasterPoints] = useState([]);
  const [clusteredPoints, setClusteredPoints] = useState([]);
  const [reliefCenters, setReliefCenters] = useState([]);
  const [shortestPaths, setShortestPaths] = useState({});
  const [clusterColors, setClusterColors] = useState({});
  const [selectedPoint, setSelectedPoint] = useState(null);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    severe: 0,
    nonSevere: 0,
    clusters: 0,
    reliefCenters: 0
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['visualization']
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${API_URL}/disaster-points`);
        if (!response.ok) {
          throw new Error('Failed to fetch disaster points');
        }
        const data = await response.json();
        setDisasterPoints(data);
        
        // Calculate stats
        const severeCount = data.filter(point => point.severity === 'high').length;
        setStats(prev => ({
          ...prev,
          severe: severeCount,
          nonSevere: data.length - severeCount
        }));
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleShowReliefCenters = async () => {
    try {
      setLoadingAction(true);
      
      // Get the clustered points
      const clustersResponse = await fetch(`${API_URL}/clustered-points`);
      if (!clustersResponse.ok) {
        throw new Error('Failed to fetch clusters');
      }
      const clustersData = await clustersResponse.json();
      
      // Get the color map
      const colorsResponse = await fetch(`${API_URL}/colormap`);
      if (!colorsResponse.ok) {
        throw new Error('Failed to fetch color map');
      }
      const colorsData = await colorsResponse.json();
      
      // Get the relief centers
      const centersResponse = await fetch(`${API_URL}/relief-centers`);
      if (!centersResponse.ok) {
        throw new Error('Failed to fetch relief centers');
      }
      const centersData = await centersResponse.json();
      
      // Update state
      setClusteredPoints(clustersData);
      setClusterColors(colorsData);
      setReliefCenters(centersData);
      
      // Update stats
      const uniqueClusters = new Set(clustersData.map(point => point.cluster).filter(c => c !== -1));
      setStats(prev => ({
        ...prev,
        clusters: uniqueClusters.size,
        reliefCenters: centersData.length
      }));
      
      setStep(2);
      setLoadingAction(false);
    } catch (err) {
      console.error("Error in handleShowReliefCenters:", err);
      setError(err.message || 'An error occurred');
      setLoadingAction(false);
    }
  };

  const handleCalculatePaths = async () => {
    try {
      setLoadingAction(true);
      
      const response = await fetch(`${API_URL}/shortest-paths`);
      if (!response.ok) {
        throw new Error('Failed to fetch shortest paths');
      }
      const data = await response.json();
      
      setShortestPaths(data);
      setStep(3);
      setLoadingAction(false);
    } catch (err) {
      console.error("Error in handleCalculatePaths:", err);
      setError(err.message || 'An error occurred');
      setLoadingAction(false);
    }
  };

  // Circle click handler
  const handleCircleClick = (point) => {
    setSelectedPoint(point);
  };

  if (!isLoaded) return <LoadingScreen message="Initializing Map..." />;
  if (loading) return <LoadingScreen message="Loading disaster data..." />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div className="ngo-portal">
      <div className="sidebar">
        <div className="logo-container">
          <FaHandHoldingHeart className="logo-icon" />
          <h1>Disaster<span>Response</span></h1>
        </div>
        
        <div className="stats-container">
          <h2>Dashboard</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon severe">!</div>
              <div className="stat-details">
                <span className="stat-value">{stats.severe}</span>
                <span className="stat-label">Severe</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon non-severe">i</div>
              <div className="stat-details">
                <span className="stat-value">{stats.nonSevere}</span>
                <span className="stat-label">Non-Severe</span>
              </div>
            </div>
            
            {step >= 2 && (
              <>
                <div className="stat-card">
                  <div className="stat-icon clusters">C</div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.clusters}</span>
                    <span className="stat-label">Clusters</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon relief">R</div>
                  <div className="stat-details">
                    <span className="stat-value">{stats.reliefCenters}</span>
                    <span className="stat-label">Relief Centers</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="controls-container">
          <h2>Operations</h2>
          
          <div className="workflow-steps">
            <div className={`workflow-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-details">
                <h3>Incidents</h3>
                <p>View all reported incidents</p>
              </div>
            </div>
            
            <div className={`workflow-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-details">
                <h3>Relief Centers</h3>
                <p>Identify optimal relief center locations</p>
              </div>
            </div>
            
            <div className={`workflow-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-details">
                <h3>Routing</h3>
                <p>Calculate optimal paths to all incidents</p>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            {step === 1 && (
              <motion.button 
                className="action-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShowReliefCenters}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <div className="loader"></div>
                ) : (
                  <>
                    <FaLayerGroup /> Identify Relief Centers
                  </>
                )}
              </motion.button>
            )}
            
            {step === 2 && (
              <motion.button 
                className="action-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCalculatePaths}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <div className="loader"></div>
                ) : (
                  <>
                    <FaRoute /> Calculate Routes
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
        
        <div className="legend-container">
          <h2>Legend</h2>
          
          {step === 1 && (
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: 'red' }}></div>
                <span>Severe Incident</span>
              </div>
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: 'blue' }}></div>
                <span>Non-Severe Incident</span>
              </div>
            </div>
          )}
          
          {step >= 2 && (
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-marker" style={{ backgroundColor: 'black' }}></div>
                <span>Unclustered</span>
              </div>
              
              {Object.entries(clusterColors).map(([clusterId, color]) => {
                if (clusterId !== '-1') {
                  return (
                    <div className="legend-item" key={`legend-${clusterId}`}>
                      <div className="legend-marker" style={{ backgroundColor: color }}></div>
                      <span>Cluster {clusterId}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="map-container">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            fullscreenControl: true,
          }}
        >
          {/* Step 1: Show disaster points */}
          {step === 1 && disasterPoints.map((point, idx) => (
            <Circle
              key={`point-${idx}`}
              center={{ lat: point.lat, lng: point.lon }}
              radius={350}
              options={{
                fillColor: point.severity === 'high' ? '#FF5252' : '#4FC3F7',
                fillOpacity: 0.8,
                strokeColor: point.severity === 'high' ? '#FF5252' : '#4FC3F7',
                strokeOpacity: 1,
                strokeWeight: 2,
              }}
              onClick={() => handleCircleClick({...point, id: idx})}
            />
          ))}
          
          {/* Step 2 & 3: Show clustered points with appropriate colors */}
          {step >= 2 && clusteredPoints.map((point, idx) => (
            <Circle
              key={`clustered-point-${idx}`}
              center={{ lat: point.lat, lng: point.lon }}
              radius={350}
              options={{
                fillColor: point.cluster === -1 ? '#212121' : clusterColors[point.cluster],
                fillOpacity: 0.8,
                strokeColor: point.cluster === -1 ? '#212121' : clusterColors[point.cluster],
                strokeOpacity: 1,
                strokeWeight: 2,
              }}
              onClick={() => handleCircleClick({...point, id: idx})}
            />
          ))}
          
          {/* Step 2 & 3: Show relief centers */}
          {step >= 2 && reliefCenters.map((center, idx) => (
            <Marker
              key={`center-${idx}`}
              position={{ lat: center.lat, lng: center.lon }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#FFFFFF',
                fillOpacity: 1,
                strokeColor: clusterColors[center.dbscan_cluster],
                strokeWeight: 5,
              }}
              title={`Relief Center ${center.dbscan_cluster}`}
            />
          ))}
          
          {/* Step 3: Show shortest paths */}
          {step === 3 && Object.entries(shortestPaths).map(([clusterId, paths]) => (
            paths.map((pathData, pathIdx) => (
              <Polyline
                key={`path-${clusterId}-${pathIdx}`}
                path={pathData.path.map(([lat, lng]) => ({ lat, lng }))}
                options={{
                  strokeColor: clusterColors[parseInt(clusterId)],
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            ))
          ))}
          
          {/* Info window for selected point */}
          {selectedPoint && (
            <InfoWindow
              position={{ lat: selectedPoint.lat, lng: selectedPoint.lon }}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div className="info-window">
                <h3>Incident Details</h3>
                <p><strong>ID:</strong> {selectedPoint.id}</p>
                <p><strong>Severity:</strong> <span className={selectedPoint.severity === 'high' ? 'severe-text' : 'non-severe-text'}>
                  {selectedPoint.severity.toUpperCase()}
                </span></p>
                {selectedPoint.cluster !== undefined && (
                  <p><strong>Cluster:</strong> {selectedPoint.cluster === -1 ? 'Unclustered' : selectedPoint.cluster}</p>
                )}
                <p><strong>Location:</strong> [{selectedPoint.lat.toFixed(4)}, {selectedPoint.lon.toFixed(4)}]</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
        
        <div className="map-overlay">
          <div className="map-title">
            <span className="map-title-text">
              {step === 1 ? 'Disaster Incidents Map' : 
               step === 2 ? 'Relief Centers & Clusters' : 
               'Response Route Network'}
            </span>
          </div>
          
          <div className="map-info">
            <FaInfoCircle />
            <span>
              {step === 1 ? 'Showing all reported incidents by severity' : 
               step === 2 ? 'Clustered incidents with optimized relief centers' : 
               'Optimized route network to all incidents'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ message }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="pulse-loader"></div>
        <h2>{message || 'Loading...'}</h2>
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon">!</div>
        <h2>Error</h2>
        <p>{message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );
}

export default NgoPortal;