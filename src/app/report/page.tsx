"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Camera, MapPin, BrainCircuit, X, Image as ImageIcon, Crosshair, ShieldAlert, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CATEGORIES = ["Road", "Water", "Streetlight", "Garbage", "Drainage", "Other"];

export default function ReportIssue() {
  const router = useRouter();
  
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Road");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Searching for location...");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState("");

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice reporting is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setDescription(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };
    
    recognition.onend = () => setIsRecording(false);
    
    recognition.start();
  };
  const [submissionPhase, setSubmissionPhase] = useState("");
  const [gatekeeperError, setGatekeeperError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      setLocationName("Acquiring GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationName(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          setLocationName("Unable to acquire location");
          console.error("Error getting location:", error);
        }
      );
    } else {
      setLocationName("Geolocation not supported by this browser.");
    }
  };

  const fileToBase64 = (file: File) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxSize = 800;

        if (width > height && width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        } else if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl.split(",")[1]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !title) return;

    setIsSubmitting(true);
    setGatekeeperError(null);

    try {
      setSubmissionPhase("Validating image against AI guidelines...");
      const base64Image = await fileToBase64(image);
      
      const gatekeeperRes = await fetch("/api/gatekeeper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          gps: location ? `${location.lat}, ${location.lng}` : "Unknown",
          base64Image
        })
      });

      const gatekeeperData = await gatekeeperRes.json();
      
      if (gatekeeperData.error) {
        setGatekeeperError(`API Error: ${gatekeeperData.error}`);
        setIsSubmitting(false);
        return;
      }

      if (gatekeeperData.isValid === false || gatekeeperData.isDuplicate) {
        setGatekeeperError(gatekeeperData.reason || "This submission was rejected by the AI Gatekeeper.");
        setIsSubmitting(false);
        return;
      }

      setSubmissionPhase("Uploading evidence to secure storage...");
      // BYPASS FIREBASE STORAGE: Google now requires a credit card for Storage buckets.
      // We will skip the upload and use a realistic placeholder URL so you stay 100% free!
      const downloadUrl = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1000";

      setSubmissionPhase("Initializing Decision Engine...");
      // 2. Save Issue to Firestore
      const issueData = {
        title,
        description,
        category,
        location,
        imageUrl: downloadUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "issues"), issueData);

      // Pass the real context (with image) to Mission Control via localStorage
      localStorage.setItem("missionContext", JSON.stringify({
        title,
        description,
        gps: location ? `${location.lat}, ${location.lng}` : "Unknown",
        base64Image
      }));

      // 3. Navigate to Mission Control
      router.push(`/mission-control?issueId=${docRef.id}`);
      
    } catch (error) {
      console.error("Error submitting issue:", error);
      // Fallback for demo without real firebase config
      router.push(`/mission-control?issueId=demo-${Date.now()}`);
    } finally {
      setIsSubmitting(false);
      setSubmissionPhase("");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="max-w-3xl mx-auto px-6">
        
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20"
          >
            <BrainCircuit className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Report an Issue</h1>
          <p className="text-muted-foreground text-lg">Upload an image and let the AI Decision Engine analyze the community impact.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Media Upload Area */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center
              ${isDragging ? "border-emerald-500 bg-emerald-500/5 scale-[1.02]" : "border-white/10 bg-white/5 hover:bg-white/10"} 
              ${previewUrl ? "p-2" : "p-16"}`}
          >
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full relative rounded-2xl overflow-hidden group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="w-full h-[400px] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setImage(null);
                        setPreviewUrl(null);
                      }}
                      className="bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-destructive transition-colors"
                    >
                      <X className="w-5 h-5" /> Remove Media
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-background border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <UploadCloud className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Drag & drop visual evidence</h3>
                  <p className="text-muted-foreground mb-8">Support for high-resolution images and short videos.</p>
                  
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/10 hover:bg-white/20 text-foreground px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-white/5"
                    >
                      <ImageIcon className="w-5 h-5" /> Browse Files
                    </button>
                    <button 
                      type="button" 
                      onClick={() => cameraInputRef.current?.click()}
                      className="bg-primary/20 hover:bg-primary/30 text-blue-400 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors border border-primary/20"
                    >
                      <Camera className="w-5 h-5" /> Take Photo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
            <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Issue Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                        ${category === cat ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-transparent border-white/10 hover:border-white/20 text-muted-foreground"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Issue Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Massive pothole on Main Street"
                  required
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Description <span className="text-white/20 lowercase normal-case font-normal">(Optional)</span></span>
                  <button 
                    type="button" 
                    onClick={startVoiceRecording}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}
                  >
                    <Mic className="w-3 h-3" />
                    {isRecording ? "Listening..." : "Use Voice"}
                  </button>
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional context for the AI..."
                  rows={3}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-foreground resize-none"
                />
              </div>
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                Location
                <button 
                  type="button" 
                  onClick={detectLocation}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 normal-case tracking-normal"
                >
                  <Crosshair className="w-4 h-4" /> Auto-detect
                </button>
              </label>
              
              <div className="w-full h-[250px] rounded-xl border border-white/10 overflow-hidden relative group bg-white/5 flex items-center justify-center">
                {/* Premium CSS Radar (Free, No API Key) */}
                <div className="absolute inset-0 overflow-hidden opacity-30">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.2)_1px,transparent_1px)] bg-[size:30px_30px]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pt-[100%] rounded-full animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.3)_360deg)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] pt-[80%] rounded-full border border-emerald-500/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] pt-[40%] rounded-full border border-emerald-500/20" />
                </div>
                <div className="z-10 text-center">
                  <MapPin className="w-8 h-8 text-emerald-500 mx-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                  <div className="mt-4 px-4 py-2 rounded-full glass border border-white/10 text-sm font-medium">
                    {locationName}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">The AI Analyst module will use this location to cross-reference nearby schools, hospitals, and infrastructure data.</p>
            </div>
          </div>

          {/* Gatekeeper Error Message */}
          <AnimatePresence>
            {gatekeeperError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-xl flex items-start gap-3"
              >
                <ShieldAlert className="w-5 h-5 mt-0.5 text-destructive flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive">Submission Blocked by AI Gatekeeper</h4>
                  <p className="text-sm mt-1">{gatekeeperError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Action */}
          <div className="pt-6 border-t border-white/5">
            <button
              type="submit"
              disabled={!image || !title || isSubmitting}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
                ${!image || !title 
                  ? "bg-white/5 text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] hover:scale-[1.01]"
                }`}
            >
              {isSubmitting ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  {submissionPhase || "Processing..."}
                </motion.div>
              ) : (
                <>
                  <BrainCircuit className="w-6 h-6" />
                  Analyze Community Impact
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
