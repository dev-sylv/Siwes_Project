import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Timetable from "./pages/Timetable";
import Announcements from "./pages/Announcements";
import Directory from "./pages/Directory";
import Guide from "./pages/Guide";
import ManageTimetable from "./pages/ManageTimetable";
import PostAnnouncement from "./pages/PostAnnouncement";
import AdminPage from "./pages/admin/AdminPage";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/guide" element={<Guide />} />
              <Route
                element={<ProtectedRoute roles={["course_rep", "admin"]} />}>
                <Route path="/manage/timetable" element={<ManageTimetable />} />
              </Route>
              <Route
                element={<ProtectedRoute roles={["president", "admin"]} />}>
                <Route
                  path="/announcements/new"
                  element={<PostAnnouncement />}
                />
              </Route>
              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
