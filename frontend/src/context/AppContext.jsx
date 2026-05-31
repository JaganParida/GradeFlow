import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "/api";
const AppCtx = createContext();

export function AppProvider({ children }) {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem("gf_token") || "",
  );

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "gf_token") {
        setAdminToken(e.newValue || "");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  async function fetchStudent(regNo) {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API}/student/${regNo}`);
      setStudentData(data);
      localStorage.setItem("last_regNo", data.regNo);
      return data;
    } catch (e) {
      setError(e.response?.data?.message || "Student not found");
      setStudentData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function adminLogin(email, password) {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    setAdminToken(data.token);
    localStorage.setItem("gf_token", data.token);
    return data;
  }

  function adminLogout() {
    setAdminToken("");
    localStorage.removeItem("gf_token");
  }

  const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

  return (
    <AppCtx.Provider
      value={{
        studentData,
        loading,
        error,
        fetchStudent,
        adminToken,
        adminLogin,
        adminLogout,
        authHeaders,
        API,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
