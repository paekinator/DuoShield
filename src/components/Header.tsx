import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Header.css';

const Header = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        // Scrolling up or at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Don't render on Mission Control page
  if (location.pathname === '/mission-control') {
    return null;
  }

  return (
    <header className={`header-nav ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="header-content">
        <div className="left-section">
          <Link to="/" className="logo">
            <img src="/AZSpaceLogo.png" alt="AZSpace Logo" className="logo-icon" />
          </Link>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
        </div>
        
        <nav className="nav-menu">
          <Link to="/features" className={`nav-link ${location.pathname === '/features' ? 'active' : ''}`}>Features</Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
