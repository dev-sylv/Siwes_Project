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
