import React, { useRef, useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';   // Import Link
import './Navbar.css';
import pickziLogo from '../Assets/pickzilogo.jpg';
import voice_icon from '../Assets/voice.png';
import { AuthAPI, loadUser, loadToken } from '../../api/client';
import { useToast } from '../Toast/ToastProvider';
import cart_icon from '../Assets/cart_icon.png';
import { ShopContext } from '../../Context/ShopContext';

const Navbar = () => {
  const [menu, setMenu] = useState("Fashion and Beauty");
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(loadToken()));
  const [displayName, setDisplayName] = useState(() => {
    try {
      const user = loadUser();
      return user?.name || user?.username || '';
    } catch {
      return '';
    }
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const recRef = useRef(null);
  const toast = useToast();
  const { getCartCount, wishlist } = useContext(ShopContext);
  const cartCount = typeof getCartCount === 'function' ? getCartCount() : 0;
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;
  const userObj = (() => { try { return loadUser(); } catch { return null; } })();

  useEffect(() => {
    const tokenPresent = Boolean(loadToken());
    setIsLoggedIn(tokenPresent);
    if (tokenPresent) {
      try {
        const user = loadUser();
        setDisplayName(user?.name || user?.username || '');
      } catch {
        setDisplayName('');
      }
    } else {
      setDisplayName('');
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'auth_token') {
        const active = Boolean(event.newValue);
        setIsLoggedIn(active);
        if (!active) setDisplayName('');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleSession = (event) => {
      const nextToken = event?.detail?.token;
      const user = event?.detail?.user;
      setIsLoggedIn(Boolean(nextToken));
      if (user) {
        setDisplayName(user.name || user.username || '');
      } else if (!nextToken) {
        setDisplayName('');
      }
    };
    window.addEventListener('auth_token_changed', handleSession);
    return () => window.removeEventListener('auth_token_changed', handleSession);
  }, []);


  const submitSearch = () => {
    const q = query.trim();
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submitSearch();
  };

  const startVoice = () => {
    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert('Voice search not supported in this browser.');
        return;
      }
      const rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setQuery(text);
        navigate(`/search?q=${encodeURIComponent(text)}`);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const stopVoice = () => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      setListening(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    AuthAPI.logout();
    setIsLoggedIn(false);
    setDisplayName('');
    setShowLogoutConfirm(false);
    toast.info('You have been logged out. See you soon!');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const showSearchActions = searchFocused || query.trim().length > 0;
  const onImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const name = file.name.replace(/\.[^.]+$/, '');
    const tokens = name.replace(/[_-]+/g, ' ').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    const q = tokens || 'image';
    setQuery(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
    e.target.value = '';
  };

  return (
    <div className='navbar'>
      {/* Logo Section */}
      <div className="nav-logo">
        <img src={pickziLogo} alt="Pickzi logo" />
        <p>PICKZI-Pick Click Done</p>
      </div>

      {/* Menu Section */}
      <ul className="nav-menu">
        <li onClick={() => setMenu("Shop")}>
          <Link to="/">Shop</Link>
          {menu === "Shop" ? <hr /> : null}
        </li>

        <li onClick={() => setMenu("Men")}>
          <Link to="/Men">Men</Link>
          {menu === "Men" ? <hr /> : null}
        </li>

        <li onClick={() => setMenu("Women")}>
          <Link to="/Women">Women</Link>
          {menu === "Women" ? <hr /> : null}
        </li>

        <li onClick={() => setMenu("Kids")}>
          <Link to="/Kids">Kids</Link>
          {menu === "Kids" ? <hr /> : null}
        </li>
      </ul>

      {/* Search Section */}
      <div className="nav-search" style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
          placeholder="Search products"
          style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:6, minWidth:220 }}
        />
        {showSearchActions && (
          <>
            <button onMouseDown={(e) => e.preventDefault()} onClick={submitSearch} style={{ padding:'8px 12px' }}>Search</button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={listening ? stopVoice : startVoice} title="Voice search" style={{ padding:'6px 8px', display:'flex', alignItems:'center', justifyContent:'center', border: listening ? '2px solid #f33' : '1px solid #ddd', borderRadius:6, background:'#fff' }}>
              <img src={voice_icon} alt="Voice" style={{ width:20, height:20, opacity: listening ? 0.7 : 1 }} />
            </button>
            <label style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:6, cursor:'pointer', background:'#fff' }} onMouseDown={(e) => e.preventDefault()}>
              📷
              <input type="file" accept="image/*" onChange={onImageSelect} style={{ display:'none' }} />
            </label>
          </>
        )}
      </div>
      {/* Login + Cart Section */}
      <div className="nav-Login-cart">
        {isLoggedIn ? (
          <>
            {displayName ? <div className="nav-user-pill">Hi, {displayName.split(' ')[0]}</div> : null}
            {userObj?.isAdmin ? (
              <Link to='/admin' style={{ marginRight: 8 }}><button>Admin</button></Link>
            ) : null}
            <button onClick={handleLogoutClick}>Logout</button>
          </>
        ) : (
          <Link to='/login'><button>Login</button></Link>
        )}
        <div className="nav-icon-wrapper">
          <Link to='/wishlist' className='nav-icon-link' aria-label={`Wishlist (${wishlistCount})`}>
            <span className="nav-icon nav-icon-heart">❤</span>
            {wishlistCount > 0 && <span className='nav-badge'>{wishlistCount}</span>}
          </Link>
        </div>
        <div className="nav-icon-wrapper">
          <Link to='/cart' className='nav-icon-link' aria-label={`Cart (${cartCount})`}>
            <img src={cart_icon} alt="Cart" className='nav-icon-img' />
            {cartCount > 0 && <span className='nav-badge'>{cartCount}</span>}
          </Link>
        </div>
      </div>
      {showLogoutConfirm && (
        <div className="logout-overlay">
          <div className="logout-card">
            <h3>Logout?</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-actions">
              <button type="button" className="logout-button logout-button--ghost" onClick={cancelLogout}>Cancel</button>
              <button type="button" className="logout-button logout-button--danger" onClick={confirmLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
