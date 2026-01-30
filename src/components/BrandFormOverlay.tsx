import { Check } from "lucide-react";
import { useEffect, useState,FormEvent } from "react";

interface BrandFormOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrandFormOverlay = ({ isOpen, onClose }: BrandFormOverlayProps) => {
  const [formData, setFormData] = useState({
    brand: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("https://formspree.io/f/xdaagbwa", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        throw new Error("Delivery failed");
      }
    } catch (error) {
      alert("Submission failed. Please email dotfluencee@gmail.com directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">
      <div className="glass p-6 sm:p-12 rounded-2xl sm:rounded-[3rem] w-full max-w-3xl relative shadow-2xl">
      <button
        onClick={onClose}
        className="absolute top-4 sm:top-8 right-4 sm:right-8 text-muted-foreground hover:text-white transition uppercase text-[9px] sm:text-[10px] font-black tracking-widest"
      >
        close
      </button>
      <h2 className="font-heading text-2xl sm:text-4xl font-black mb-2 sm:mb-4 uppercase text-primary">
        Request Access
      </h2>
      <p className="text-muted-foreground mb-6 sm:mb-10 text-xs sm:text-sm font-medium">
        Initialize your brand profile for orchestration.
      </p>
      <div className="glass p-6 sm:p-10 md:p-16 rounded-3xl sm:rounded-5xl text-left border-border shadow-2xl relative overflow-hidden">
        {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
            Contact Name
            </label>
            <input
            type="text"
            name="name"
            required
            placeholder="Your Name"
            className="w-full bg-muted/50 border border-border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-5 focus:border-primary outline-none text-foreground transition font-medium text-sm"
            />
          </div>
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
            Email Address
            </label>
            <input
            type="email"
            name="email"
            required
            placeholder="you@brand.com"
            className="w-full bg-muted/50 border border-border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-5 focus:border-primary outline-none text-foreground transition font-medium text-sm"
            />
          </div>
          </div>
          <div>
          <label className="block text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
            Campaign Context
          </label>
          <textarea
            name="message"
            rows={4}
            required
            placeholder="Describe your scale requirements..."
            className="w-full bg-muted/50 border border-border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-5 focus:border-primary outline-none text-foreground transition font-medium resize-none text-sm"
          />
          </div>
          <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
          >
          {isSubmitting ? "Transmitting..." : "Transmit Inquiry"}
          </button>
        </form>
        ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-6 sm:p-10 text-center animate-in fade-in duration-500">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <Check className="w-8 sm:w-10 h-8 sm:h-10" strokeWidth={3} />
          </div>
          <h3 className="text-xl sm:text-3xl font-black mb-3 sm:mb-4">Inquiry Received</h3>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-sm">
          Your query has been successfully routed to{" "}
          <strong>dotfluencee@gmail.com</strong>. Our logistics lead will
          reach out within 12 hours.
          </p>
          <button
          onClick={resetForm}
          className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:underline"
          >
          Send another inquiry
          </button>
        </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default BrandFormOverlay;
