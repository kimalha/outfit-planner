import React, { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useOutfit } from "./context/OutfitContext";
import { usePlanner } from "./context/PlannerContext";
import { useNotifications } from "./context/NotificationContext";
import { usePosts } from "./context/PostContext";
import api from "./utils/api";

// Pages
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Login/RegisterPage";
import HomePage from "./pages/Home/HomePage";
import CalendarPage from "./pages/Calendar/CalendarPage";
import CatalogPage from "./pages/Catalog/CatalogPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import HistoryPage from "./components/HistoryPage";

// Components
import BottomNav from "./components/BottomNavbar/BottomNav";
import AddOutfitModal from "./components/modals/AddOutfitModal";
import NotificationModal from "./components/modals/NotificationModal";

export default function App() {
  const { loggedIn, isRegistering, setIsRegistering, login } = useAuth();
  const { fetchClothes } = useOutfit();
  const { fetchPlans } = usePlanner();
  const { fetchNotifications } = useNotifications();
  const { fetchPosts } = usePosts();
  
  const [page, setPage] = useState("home");
  const [showAddModal, setShowAddModal] = useState(false);

  const checkAndMigrate = async () => {
    const hasPlanner = localStorage.getItem("outfit_planner_data");
    const hasNotifications = localStorage.getItem("outfit_notifications");
    const hasPrefs = localStorage.getItem("style_preferences");
    const hasPosts = localStorage.getItem("outfit_user_posts");

    if (hasPlanner || hasNotifications || hasPrefs || hasPosts) {
      console.log("[Migration] Legacy data detected, starting migration...");
      try {
        const payload = {
          plannerData: hasPlanner ? JSON.parse(hasPlanner) : {},
          notifications: hasNotifications ? JSON.parse(hasNotifications) : [],
          stylePreferences: hasPrefs ? JSON.parse(hasPrefs) : [],
          posts: hasPosts ? JSON.parse(hasPosts) : []
        };

        const response = await api.post("/api/migrate", payload);
        if (response.data.success) {
          console.log("[Migration] Migration success. Cleaning up localStorage.");
          localStorage.removeItem("outfit_planner_data");
          localStorage.removeItem("outfit_notifications");
          localStorage.removeItem("style_preferences");
          localStorage.removeItem("outfit_user_posts");
          alert("🎉 Data Anda berhasil dimigrasikan ke cloud!");
        }
      } catch (err) {
        console.error("[Migration] Migration failed:", err);
      }
    }

    // Load fresh data from the database
    fetchClothes();
    fetchPlans();
    fetchNotifications();
    fetchPosts();
  };

  useEffect(() => {
    if (loggedIn) {
      checkAndMigrate();
    }
  }, [loggedIn]);

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage setPage={setPage} />;
      case "calendar":
        return <CalendarPage setPage={setPage} />;
      case "catalog":
        return <CatalogPage setPage={setPage} />;
      case "profile":
        return <ProfilePage setPage={setPage} />;
      case "history":
        return <HistoryPage setPage={setPage} />;
      default:
        return <HomePage setPage={setPage} />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200" style={{fontFamily:"'DM Sans', sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        
        .phone-shell {
          width: 390px;
          height: min(844px, 100dvh);
          border-radius: 40px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.3), 0 0 0 8px #1a1a1a, inset 0 0 0 2px #333;
        }
        
        .phone-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 128px;
          height: 24px;
          background-color: black;
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          z-index: 50;
        }
        
        @media (max-width: 640px) {
          .phone-shell {
            width: 100vw !important;
            height: 100dvh !important;
            max-width: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .phone-notch {
            display: none !important;
          }
        }
      `}</style>

      {/* Phone shell */}
      <div className="phone-shell relative bg-white overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="phone-notch" />

        {!loggedIn ? (
          <div className="flex-1 h-full overflow-hidden flex flex-col" style={{ paddingTop: "max(env(safe-area-inset-top), 24px)", paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            {isRegistering ? (
              <RegisterPage onBackToLogin={() => setIsRegistering(false)} />
            ) : (
              <LoginPage 
                onLogin={login} 
                onGoToRegister={() => setIsRegistering(true)} 
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}>
              {renderPage()}
            </div>
            <BottomNav page={page} setPage={setPage} onAddClick={() => setShowAddModal(true)} />
            {showAddModal && (
              <AddOutfitModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { 
                  setPage("catalog"); 
                }}
              />
            )}
            <NotificationModal />
          </>
        )}
      </div>
    </div>
  );
}