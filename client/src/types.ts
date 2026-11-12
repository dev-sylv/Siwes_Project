export type Role = "student" | "course_rep" | "president" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  level: number;
}

export interface AuthResponse extends User {
  token: string;
}

export type Day =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface Course {
  _id: string;
  code: string;
  title: string;
  units: number;
  level: number;
  semester: "first" | "second";
}

export interface TimetableEntry {
  _id: string;
  course: Course | string;
  day: Day;
  startTime: string;
  endTime: string;
  venue: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  targetLevel: number | null;
  pinned: boolean;
  postedBy?: { _id: string; name: string } | string;
  createdAt: string;
}

export interface Lecturer {
  _id: string;
  name: string;
  title?: string;
  email?: string;
  isHod?: boolean;
}

export interface Exco {
  _id: string;
  position: string;
  name: string;
}

export interface CourseAssignment {
  _id: string;
  course: Pick<Course, "_id" | "code" | "title" | "level" | "semester">;
  lecturer: Lecturer;
}

export interface DirectoryData {
  session: { _id: string; name: string } | null;
  hod: Lecturer | null;
  excos: Exco[];
  courseLecturers: CourseAssignment[];
}

export interface RoleRequest {
  _id: string;
  user:
    | { _id: string; name: string; email: string; level: number; role: Role }
    | string;
  requestedRole: "course_rep" | "president";
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
