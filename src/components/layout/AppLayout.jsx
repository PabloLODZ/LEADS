import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import ToastContainer from './ToastContainer.jsx';
import BuyCreditsModal from '../../pages/settings/BuyCreditsModal.jsx';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);

  const handleToggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleToggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className={`app-layout ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Toggle Button */}
      <button className="mobile-menu-toggle" onClick={handleToggleMobile}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}></div>
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggleSidebar}
        onFeedbackClick={() => setFeedbackOpen(true)}
        onBuyCredits={() => setBuyCreditsOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Outlet />
      </main>

      {/* Modals & Global Toast */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <BuyCreditsModal isOpen={buyCreditsOpen} onClose={() => setBuyCreditsOpen(false)} />
      <ToastContainer />
    </div>
  );
}
