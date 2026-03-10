import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  onBack: () => void;
}

export default function PageHeader({ title, onBack }: PageHeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-md no-print">
      <button
        type="button"
        onClick={onBack}
        data-ocid="nav.button"
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
