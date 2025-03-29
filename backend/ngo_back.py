# main.py
from fastapi import FastAPI, HTTPException
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
import matplotlib.cm as cm
import matplotlib.colors as colors
import googlemaps
import polyline
from datetime import datetime

app = FastAPI(
    title="NGO Disaster Response API",
    description="API for disaster response coordination",
    version="0.1.0"
)



# Initialize Google Maps client with your API key
GOOGLE_MAPS_API_KEY = "AIzaSyCcQrmxY2lwqHAnzLr6PaE72U1zsfN2sbg"
gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

# Generate data as in your original code
np.random.seed(42)
coordinates = np.random.uniform(low=[28.50, 77.00], high=[28.80, 77.30], size=(100, 2))
severities = np.random.choice(['high', 'low'], size=100, p=[0.3, 0.7])  # 30% high severity
data = pd.DataFrame(coordinates, columns=['lat', 'lon'])
data['severity'] = severities

# Pre-compute clusters to ensure consistency
coords = data[['lat', 'lon']].to_numpy()
dbscan = DBSCAN(eps=0.03, min_samples=5, metric='haversine').fit(coords)
data['cluster'] = dbscan.labels_

@app.get("/")
def read_root():
    return {"message": "NGO Disaster Response API is running"}

@app.get("/disaster-points")
def get_disaster_points():
    """
    Get all disaster points with their severity (high/low)
    """
    result = data[['lat', 'lon', 'severity']].to_dict(orient='records')
    return result

@app.get("/clustered-points")
def get_clustered_points():
    """
    Get all disaster points with their severity and cluster assignment
    """
    result = data[['lat', 'lon', 'severity', 'cluster']].to_dict(orient='records')
    return result

@app.get("/colormap")
def get_colormap():
    """
    Get the color mapping for each cluster
    """
    # Create colors for each cluster
    num_clusters = len(set(data['cluster'])) - (1 if -1 in data['cluster'] else 0)
    cluster_colors = {}
    
    colormap = cm.get_cmap('tab10', num_clusters)
    color_norm = colors.Normalize(vmin=0, vmax=num_clusters - 1)
    
    for i in range(num_clusters):
        rgba = colormap(color_norm(i))
        hex_color = colors.rgb2hex(rgba)
        cluster_colors[i] = hex_color
    
    # Add color for noise points
    cluster_colors[-1] = '#000000'  # Black for noise
    
    return cluster_colors

@app.get("/relief-centers")
def get_relief_centers():
    """
    Get relief centers - one for each cluster
    """
    # Create relief centers (one per cluster)
    relief_centers = []
    for cluster_id in sorted(set(data['cluster'])):
        if cluster_id != -1:  # Exclude noise points
            cluster_data = data[data['cluster'] == cluster_id]
            # Use the center of each cluster
            center_lat = cluster_data['lat'].mean()
            center_lon = cluster_data['lon'].mean()
            relief_centers.append({
                'lat': float(center_lat),
                'lon': float(center_lon),
                'dbscan_cluster': int(cluster_id)
            })
    
    return relief_centers

@app.get("/shortest-paths")
def get_shortest_paths():
    """
    Calculate and return the shortest paths from relief centers to each point in their cluster
    """
    # Get relief centers
    relief_centers_data = get_relief_centers()
    relief_centers_df = pd.DataFrame(relief_centers_data)
    
    # Calculate shortest paths using Google Maps API
    paths_by_cluster = {}
    
    for _, center in relief_centers_df.iterrows():
        cluster_id = center['dbscan_cluster']
        cluster_points = data[data['cluster'] == cluster_id]
        
        paths = []
        for _, point in cluster_points.iterrows():
            try:
                # Request directions from Google Maps API
                directions_result = gmaps.directions(
                    origin=(center['lat'], center['lon']),
                    destination=(point['lat'], point['lon']),
                    mode="driving",
                    departure_time=datetime.now()
                )
                
                if directions_result:
                    # Extract polyline points
                    polyline_points = directions_result[0]['overview_polyline']['points']
                    # Decode the polyline to get path coordinates
                    path_coords = polyline.decode(polyline_points)
                    
                    paths.append({
                        'point_id': int(point.name),
                        'point': [float(point['lat']), float(point['lon'])],
                        'path': path_coords
                    })
            except Exception as e:
                print(f"Error calculating path: {e}")
                # Fallback to direct line if Google API fails
                paths.append({
                    'point_id': int(point.name),
                    'point': [float(point['lat']), float(point['lon'])],
                    'path': [
                        [float(center['lat']), float(center['lon'])],
                        [float(point['lat']), float(point['lon'])]
                    ]
                })
        
        paths_by_cluster[int(cluster_id)] = paths
    
    return paths_by_cluster