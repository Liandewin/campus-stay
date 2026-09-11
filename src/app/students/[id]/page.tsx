import type { Metadata } from "next";
import { StudentDetailView } from "@/components/views/student-detail";
import { SEED } from "@/lib/seed";

export async function generateMetadata(props: PageProps<"/students/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const student = SEED.students.find((s) => s.id === id);
  return { title: student ? `${student.firstName} ${student.lastName}` : "Student" };
}

// Students can be created in the browser (by approving applications), so an
// unknown id is resolved client-side rather than 404ing here.
export default async function StudentPage(props: PageProps<"/students/[id]">) {
  const { id } = await props.params;
  return <StudentDetailView id={id} />;
}
