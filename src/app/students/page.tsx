import type { Metadata } from "next";
import { StudentsView } from "@/components/views/students";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return <StudentsView />;
}
