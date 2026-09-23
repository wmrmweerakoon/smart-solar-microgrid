import { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fading out after 2.5 seconds
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 2500);

    // Call onComplete to unmount after fade transition (3 seconds total)
    const timer2 = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fade ? 'fade-out' : ''}`}>
      <div className="solar-system">
        {/* Core Sun */}
        <div className="solar-core"></div>
        
        {/* Rings */}
        <div className="ring ring-1">
          <div className="orb orb-1"></div>
        </div>
        <div className="ring ring-2">
          <div className="orb orb-2"></div>
        </div>
        <div className="ring ring-3">
          <div className="orb orb-3"></div>
        </div>
      </div>
      <h2 className="splash-title">Initializing Microgrid...</h2>
    </div>
  );
};

export default SplashScreen;
