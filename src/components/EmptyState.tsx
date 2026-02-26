import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center animate-fade-in">
    <div className="rounded-2xl bg-muted p-6">
      <Icon className="h-12 w-12 text-muted-foreground" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default EmptyState;
