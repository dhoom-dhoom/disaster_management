import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig.js";

const VerifyFirestoreFetch = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      console.log("📡 Connecting to Firestore...");
      const q = query(collection(db, "disaster_reports"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
          console.warn("⚠️ No documents found in Firestore!");
        }

        const disasterData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("🔥 Live Firestore Data:", JSON.stringify(disasterData, null, 2));
        setDisasters(disasterData);
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    } catch (error) {
      console.error("🚨 Firestore Fetch Error:", error);
    }
  }, []);

  return (
    <div>
      <h1>Verify Firestore Fetch</h1>
      {loading ? <p>Loading...</p> : <pre>{JSON.stringify(disasters, null, 2)}</pre>}
    </div>
  );
};

export default VerifyFirestoreFetch;
