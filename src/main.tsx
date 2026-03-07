import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import axios from "axios";

// Configure Axios globally to point to the production API if configured or in PROD
const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://kaiu-api.onrender.com' : '');
if (apiUrl) {
  axios.defaults.baseURL = apiUrl;
}

createRoot(document.getElementById("root")!).render(<App />);
