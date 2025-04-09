import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Questions from "./components/Questions";
import Hero from "./components/Hero";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hero/>} />
        <Route path="/app" element={<Questions/>} />
      </Routes>
    </Router>
  );
}

export default App;