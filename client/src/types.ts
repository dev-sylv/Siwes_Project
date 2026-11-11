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
