import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TricolourStrip } from './TricolourStrip';
import { UtilityBar } from './UtilityBar';
import { DisclaimerBar } from './DisclaimerBar';
import { Header } from './Header';
import { NavBar } from './NavBar';
import { DemoControlsBar } from './DemoControlsBar';
import { Breadcrumbs } from './Breadcrumbs';
import { Footer } from './Footer';
import { GuidedTourBox } from '../Common/GuidedTourBox';

export const Layout: React.FC = () => {
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Tricolour Strip */}
      <TricolourStrip />

      {/* 2. Utility Bar */}
      <UtilityBar />

      {/* 3. Prototype Disclaimer Bar */}
      <DisclaimerBar />

      {/* 4. Portal Header */}
      <Header />

      {/* 5. Primary Dark Navy Nav */}
      <NavBar />

      {/* Demo Controls Bar */}
      <DemoControlsBar onTourToggle={() => setTourOpen(!tourOpen)} />

      {/* 6. Breadcrumb Trail */}
      <Breadcrumbs />

      {/* Main Content Area */}
      <main id="main-content" style={{ flex: 1, padding: '0 0 30px 0' }}>
        <Outlet />
      </main>

      {/* 7. Government Portal Footer */}
      <Footer />

      {/* Guided 3-Minute Demo Tour Dialog */}
      <GuidedTourBox isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
};
