import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout    from "./components/Layout";
import Login     from "./pages/Login";
import Register  from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CheckNews from "./pages/CheckNews";
import History   from "./pages/History";
import Result    from "./pages/Result";
import Bookmarks from "./pages/Bookmarks";
import Learn     from "./pages/Learn";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"var(--text3)" }}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/check"       element={<CheckNews />} />
        <Route path="/history"     element={<History />} />
        <Route path="/result/:id"  element={<Result />} />
        <Route path="/bookmarks"   element={<Bookmarks />} />
        <Route path="/learn"       element={<Learn />} />
      </Route>
    </Routes>
  );
}