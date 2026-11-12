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
import AdminPage from "./pages/admin/AdminPage";

const Placeholder = ({ title }: { title: string }) => <h2>{title}</h2>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route
                path="/guide"
                element={<Placeholder title="Freshers' Guide" />}
              />
              <Route
                element={<ProtectedRoute roles={["course_rep", "admin"]} />}>
                <Route
                  path="/manage/timetable"
                  element={<Placeholder title="Manage Timetable" />}
                />
              </Route>
              <Route
                element={<ProtectedRoute roles={["president", "admin"]} />}>
                <Route
                  path="/announcements/new"
                  element={<Placeholder title="Post Announcement" />}
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
