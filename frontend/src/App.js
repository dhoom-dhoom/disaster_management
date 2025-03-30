import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "C:/Users/ashva/OneDrive/Desktop/disaster/frontend/src/Components/Home";
import NgoPortal from "C:/Users/ashva/OneDrive/Desktop/disaster/frontend/src/Components/Ngo";
import DisasterMap from "C:/Users/ashva/OneDrive/Desktop/disaster/frontend/src/Components/UserForm";
import VerifyFirestoreFetch from "C:/Users/ashva/OneDrive/Desktop/disaster/frontend/src/Components/Verify";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ngo" element={<NgoPortal />} />
      <Route path="/help" element={<DisasterMap />} />
      <Route path="/verify" element={<VerifyFirestoreFetch />} />
    </Routes>
  );
}
