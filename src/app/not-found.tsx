import Link from "next/link";
import { buttonStyles } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">That page doesn&apos;t exist in this demo.</p>
      <Link href="/" className={`${buttonStyles()} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
