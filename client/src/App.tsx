import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
              <Route path="/" element={<Placeholder title="Dashboard" />} />
              <Route
                path="/timetable"
                element={<Placeholder title="Timetable" />}
              />
              <Route
                path="/directory"
                element={<Placeholder title="Directory" />}
              />
              <Route
                path="/announcements"
                element={<Placeholder title="Announcements" />}
              />
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
                <Route path="/admin" element={<Placeholder title="Admin" />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
