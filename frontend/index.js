// Frontend application entry point
console.log('ShadowMe Frontend Application');
console.log('Application starting on port 3001...');

// TODO: Add your application code here
// Example: React app, Vue app, or other frontend framework

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import LoginForm from "./components/LoginForm.jsx";
import SignupForm from "./components/SignupForm.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ new route */}
      </Routes>
    </Router>
  );
}
