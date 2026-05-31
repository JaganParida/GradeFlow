import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/:regNo" element={<Dashboard />} />
        <Route path="/analytics/:regNo" element={<Analytics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}
