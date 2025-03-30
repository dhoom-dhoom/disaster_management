"use client"

import { useState, useEffect } from "react";
import DisasterCard from "C:/Users/ashva/OneDrive/Desktop/disaster/frontend/src/Components/DisasterCard.js";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig.js";

const Home = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "disaster_reports"));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const disasterData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      console.log("Fetched disasters:", JSON.stringify(disasterData, null, 2)); // Log the data
      setDisasters(disasterData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching disasters:", error);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>Disaster Tracker</h1>
          <p style={styles.subtitle}>
            Stay informed about disasters worldwide and find ways to help affected communities
          </p>
          
          <div style={styles.statsContainer}>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{disasters.length}</span>
              <span style={styles.statLabel}>Active Events</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>
                {disasters.filter(d => d.severity === "Critical" || d.severity === "High").length}
              </span>
              <span style={styles.statLabel}>Critical</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statNumber}>
                {disasters.filter(d => d.category?.toLowerCase() === "earthquake").length}
              </span>
              <span style={styles.statLabel}>Earthquakes</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.contentContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading disaster information...</p>
          </div>
        ) : (
          <>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Recent Disasters</h2>
              <span style={styles.resultsCount}>{disasters.length} events</span>
            </div>
            
            <div style={styles.grid}>
              {disasters.length > 0 ? (
                disasters.map((disaster) => (
                  <DisasterCard key={disaster.id} disaster={disaster} />
                ))
              ) : (
                <div style={styles.noData}>
                  <i className="fa-solid fa-triangle-exclamation" style={styles.noDataIcon}></i>
                  <p style={styles.noDataText}>No disasters found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: "#0f0f13", minHeight: "100vh", color: "white" },
  hero: { background: "linear-gradient(to right, rgba(15, 15, 19, 0.9), rgba(15, 15, 19, 0.6)), url('/images/world-map.png')", backgroundSize: "cover", backgroundPosition: "center", padding: "60px 20px", position: "relative" },
  heroContent: { maxWidth: "900px", margin: "0 auto", textAlign: "center" },
  title: { fontSize: "56px", fontWeight: "800", marginBottom: "15px", background: "linear-gradient(135deg, #8a2be2, #4158D0, #C850C0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "0 2px 10px rgba(138, 43, 226, 0.3)" },
  subtitle: { fontSize: "18px", color: "#b0b7c1", maxWidth: "700px", margin: "0 auto 40px", lineHeight: "1.6" },
  statsContainer: { display: "flex", justifyContent: "center", gap: "30px", marginTop: "20px" },
  statBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", backgroundColor: "rgba(25, 25, 35, 0.7)", borderRadius: "12px", minWidth: "120px" },
  statNumber: { fontSize: "32px", fontWeight: "700", marginBottom: "5px", color: "#fff" },
  statLabel: { fontSize: "14px", color: "#b0b7c1", textTransform: "uppercase", letterSpacing: "1px" },
  contentContainer: { maxWidth: "1300px", margin: "0 auto", padding: "40px 20px" },
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "30px" },
};

export default Home;
