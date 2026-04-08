/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Check, Share2, Sparkles, Instagram, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ShareMyCardProps {
  handle: string;
  fullName: string;
  themeKey: 'light' | 'dark';
}

export const ShareMyCard = ({ handle, fullName, themeKey }: ShareMyCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const mediaKitUrl = `https://platform.dotfluence.in/creators/${handle}`;

  const copyLink = () => {
    navigator.clipboard.writeText(mediaKitUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Small delay to ensure rendering
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: themeKey === 'dark' ? '#050505' : '#ffffff',
        scale: 2, // High quality
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `${handle}-dotfluence-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Card downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} overflow-hidden relative group`}>
        {/* Glow behind */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
        
        <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
          <CardTitle className={`text-xl font-black ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            Share My Kit
            <Sparkles size={16} className="text-blue-500" />
          </CardTitle>
          <CardDescription className={`${themeKey === 'dark' ? 'text-white/50' : 'text-slate-500'} font-bold text-[10px] uppercase tracking-wider`}>QRCode & Link</CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-6 pb-6 space-y-4">
          {/* Static Preview of QR */}
          <div 
            onClick={() => setShowQRModal(true)}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              themeKey === 'dark' 
                ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            } flex flex-col items-center justify-center gap-3`}
          >
            <div className={`p-2 rounded-xl ${themeKey === 'dark' ? 'bg-white' : 'bg-white shadow-sm'}`}>
              <QRCodeSVG value={mediaKitUrl} size={100} level="H" includeMargin={false} />
            </div>
            <div className="text-center">
              <p className={`text-xs font-black ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Click to Expand</p>
              <p className={`text-[10px] ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Shareable Creator Card</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={copyLink}
              size="sm"
              className={`flex-1 rounded-xl font-black text-xs h-10 transition-all ${
                themeKey === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
            <Button
              onClick={() => setShowQRModal(true)}
              size="sm"
              className="flex-1 rounded-xl font-black text-xs h-10 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
            >
              <Share2 size={14} className="mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR & Card Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQRModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              {/* THE SHARABLE CARD (Target for html2canvas) */}
              <div 
                ref={cardRef}
                className={`p-1 w-full aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 shadow-2xl overflow-hidden`}
              >
                <div className={`w-full h-full rounded-[2.3rem] p-8 flex flex-col items-center justify-between text-center relative overflow-hidden ${
                  themeKey === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'
                }`}>
                  {/* Subtle pattern background */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                  </div>

                  <div className="z-10 w-full">
                    <div className={`w-12 h-12 ${themeKey === 'dark' ? 'bg-white/10' : 'bg-black/5'} rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10`}>
                      <span className="font-black text-xl text-blue-500">D</span>
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>{fullName}</h3>
                    <div className="flex items-center justify-center gap-1.5 mt-1 text-blue-500 font-bold text-sm">
                      <Instagram size={14} />
                      @{handle}
                    </div>
                  </div>

                  <div className={`p-4 rounded-3xl ${themeKey === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100'} shadow-inner`}>
                    <div className={`p-3 rounded-2xl ${themeKey === 'dark' ? 'bg-white' : 'bg-white shadow-xl'}`}>
                      <QRCodeSVG value={mediaKitUrl} size={160} level="H" />
                    </div>
                  </div>

                  <div className="z-10 w-full">
                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${themeKey === 'dark' ? 'text-white/30' : 'text-slate-400'} mb-2`}>
                      Live Media Kit
                    </p>
                    <p className={`text-xs font-bold ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                      platform.dotfluence.in/creators/{handle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions below the card */}
              <div className="mt-6 flex flex-col gap-3">
                <Button 
                  onClick={downloadCard}
                  disabled={downloading}
                  className="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-100 font-black text-base shadow-xl active:scale-[0.98] transition-all"
                >
                  {downloading ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-slate-900" />
                  ) : (
                    <>
                      <Download size={20} className="mr-3" />
                      Download My Card
                    </>
                  )}
                </Button>
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="text-white/50 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest pt-2"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
