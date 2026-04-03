import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

function AppRoutes({ user, setUser }) {
  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={user ? <Home user={user} setUser={setUser} /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default AppRoutes;

