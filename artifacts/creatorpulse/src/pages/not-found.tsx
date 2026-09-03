import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#20243b] p-6 text-[#f2eedf]">
      <div className="w-full max-w-md rounded-[22px] border border-[#4b4e65] bg-[#292d47] p-8">
        <AlertCircle className="h-8 w-8 text-[#f28b67]" />
        <div className="eyebrow mt-7 !text-[#d8f66a]">Signal lost / 404</div>
        <h1 className="display mt-2 text-3xl font-bold">This route is off the map.</h1>
        <p className="mt-3 text-sm leading-6 text-[#b7b7c0]">The command center could not find that destination.</p>
        <Link href="/dashboard" className="mt-7 inline-flex rounded-xl bg-[#d8f66a] px-4 py-3 text-xs font-bold text-[#20243b]" data-testid="link-return-dashboard">Return to pulse</Link>
      </div>
    </div>
  );
}
