import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

const SplashScreen = ({ onComplete }) => {
  const [fade, setFade] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Smooth progress steps
    const p1 = setTimeout(() => setProgress(45), 350);
    const p2 = setTimeout(() => setProgress(78), 1000);
    const p3 = setTimeout(() => setProgress(100), 1700);

    // Start fading out after 2.3 seconds
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 2300);

    // Call onComplete to unmount after fade transition (2.8 seconds total)
    const timer2 = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fade ? 'fade-out' : ''}`}>
      <div className="splash-energy-container">
        {/* Pulsing energy wave rings radiating from logo */}
        <div className="splash-pulse-ring splash-pulse-1"></div>
        <div className="splash-pulse-ring splash-pulse-2"></div>
        <div className="splash-pulse-ring splash-pulse-3"></div>

        {/* Orbiting microgrid energy packet particles */}
        <div className="splash-orbit-track">
          <div className="splash-orbit-node node-1"></div>
          <div className="splash-orbit-node node-2"></div>
        </div>

        {/* Center Logo with Dynamic Glow Aura */}
        <div className="splash-logo-wrapper">
          <img src={logo} alt="Smart Solar Microgrid Logo" className="splash-logo-img" />
          <div className="splash-logo-glow"></div>
        </div>
      </div>

      <div className="splash-content">
        <h1 className="splash-brand-title">Smart Solar Microgrid</h1>
        <p className="splash-brand-subtitle">Peer-to-Peer Clean Energy Network</p>

        {/* Dynamic Microgrid Progress Track */}
        <div className="splash-progress-track">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="splash-status-text">
          {progress < 50 ? 'Connecting to Grid Nodes...' : progress < 90 ? 'Synchronizing Telemetry...' : 'Grid Ready'}
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
