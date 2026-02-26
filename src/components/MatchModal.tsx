import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Heart } from "lucide-react";

interface MatchModalProps {
  open: boolean;
  onClose: () => void;
}

const MatchModal = ({ open, onClose }: MatchModalProps) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="flex flex-col items-center gap-6 text-center border-none gradient-hero rounded-2xl max-w-sm">
      <div className="relative">
        <Heart className="h-24 w-24 text-primary animate-heart-burst" fill="currentColor" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="h-24 w-24 text-primary opacity-30 animate-float-up" fill="currentColor" />
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-foreground">It's a Match 💘</h2>
        <p className="mt-2 text-muted-foreground">You both liked each other!</p>
      </div>
      <button
        onClick={onClose}
        className="gradient-primary text-primary-foreground rounded-xl px-8 py-3 font-semibold hover-scale shadow-lg"
      >
        Keep Swiping
      </button>
    </DialogContent>
  </Dialog>
);

export default MatchModal;
