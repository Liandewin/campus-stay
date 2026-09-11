import type { Metadata } from "next";
import { ResidencesView } from "@/components/views/residences";

export const metadata: Metadata = { title: "Residences" };

export default function ResidencesPage() {
  return <ResidencesView />;
}
