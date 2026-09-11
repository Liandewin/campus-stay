import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResidenceDetailView } from "@/components/views/residence-detail";
import { RESIDENCES } from "@/lib/seed";

export function generateStaticParams() {
  return RESIDENCES.map((r) => ({ id: r.id }));
}

export async function generateMetadata(props: PageProps<"/residences/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: RESIDENCES.find((r) => r.id === id)?.name ?? "Residence" };
}

export default async function ResidencePage(props: PageProps<"/residences/[id]">) {
  const { id } = await props.params;
  // Residences are fixed in the demo, so unknown ids can 404 on the server.
  if (!RESIDENCES.some((r) => r.id === id)) notFound();
  return <ResidenceDetailView id={id} />;
}
