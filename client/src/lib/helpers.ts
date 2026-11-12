/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Course } from "../types";

export function toList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  const body = data?.data ?? data;
  if (Array.isArray(body)) return body;
  const firstArray = body && Object.values(body).find(Array.isArray);
  return (firstArray as T[]) ?? [];
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function courseInfo(course: Course | string) {
  return typeof course === "string"
    ? { code: "Course", title: "" }
    : { code: course.code, title: course.title };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
