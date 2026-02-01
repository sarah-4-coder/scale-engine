import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSupabaseAuthListener } from "./lib/supabaseAuthListener.ts";
initSupabaseAuthListener();
createRoot(document.getElementById("root")!).render(<App />);
