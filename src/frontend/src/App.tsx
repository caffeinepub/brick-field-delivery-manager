import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AddPendingDelivery from "./pages/AddPendingDelivery";
import CompleteDeliveryList from "./pages/CompleteDeliveryList";
import Dashboard from "./pages/Dashboard";
import DirectDelivery from "./pages/DirectDelivery";
import PendingDeliveryList from "./pages/PendingDeliveryList";
import Settings from "./pages/Settings";
import Statement from "./pages/Statement";

type Page =
  | "dashboard"
  | "add-pending"
  | "direct-delivery"
  | "pending-list"
  | "complete-list"
  | "settings"
  | "statement";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const navigate = (page: Page) => setCurrentPage(page);
  const goBack = () => setCurrentPage("dashboard");

  return (
    <div className="mobile-container">
      {currentPage === "dashboard" && <Dashboard navigate={navigate} />}
      {currentPage === "add-pending" && (
        <AddPendingDelivery
          onBack={goBack}
          onSuccess={() => navigate("pending-list")}
        />
      )}
      {currentPage === "direct-delivery" && (
        <DirectDelivery
          onBack={goBack}
          onSuccess={() => navigate("complete-list")}
        />
      )}
      {currentPage === "pending-list" && (
        <PendingDeliveryList onBack={goBack} />
      )}
      {currentPage === "complete-list" && (
        <CompleteDeliveryList onBack={goBack} />
      )}
      {currentPage === "settings" && <Settings onBack={goBack} />}
      {currentPage === "statement" && <Statement onBack={goBack} />}
      <Toaster position="top-center" richColors />
    </div>
  );
}
