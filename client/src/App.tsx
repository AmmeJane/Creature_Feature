import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/HomePage";
import { Discover } from "./pages/DiscoverPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
      </Routes>
    </BrowserRouter>
  );
}