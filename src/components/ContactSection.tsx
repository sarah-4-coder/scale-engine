import { useState, useEffect, useRef, FormEvent } from "react";
import { Check } from "lucide-react";

const ContactSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const reveals = sectionRef.current?.querySelectorAll(".reveal");
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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
    <section
      id="contact"
      ref={sectionRef}
      className="py-40 px-6 md:px-12 text-center relative z-10"
    >
      <div className="max-w-4xl mx-auto reveal">
        <h2 className="text-6xl md:text-9xl font-black mb-10 tracking-tighter">
          Scale <span className="text-gradient">Now</span>
        </h2>
        <p className="text-muted-foreground text-xl mb-16 max-w-2xl mx-auto font-medium">
          For campaign inquiries, data decks, or high-scale logistics, reach out
          directly.
        </p>

        <div className="glass p-12 md:p-16 rounded-5xl text-left border-border shadow-2xl relative overflow-hidden">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your Name"
                    className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-5 focus:border-primary outline-none text-foreground transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@brand.com"
                    className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-5 focus:border-primary outline-none text-foreground transition font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                  Campaign Context
                </label>
                <textarea
                  name="message"
                  rows={4}
                  required
                  placeholder="Describe your scale requirements..."
                  className="w-full bg-muted/50 border border-border rounded-2xl px-6 py-5 focus:border-primary outline-none text-foreground transition font-medium resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-6 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {isSubmitting ? "Transmitting..." : "Transmit Inquiry"}
              </button>
            </form>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-10 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10" strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black mb-4">Inquiry Received</h3>
              <p className="text-muted-foreground mb-8">
                Your query has been successfully routed to{" "}
                <strong>dotfluencee@gmail.com</strong>. Our logistics lead will
                reach out within 12 hours.
              </p>
              <button
                onClick={resetForm}
                className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                Send another inquiry
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
