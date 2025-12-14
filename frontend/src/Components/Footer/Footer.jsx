import React from 'react'
import './Footer.css'
import pickziLogo from '../Assets/pickzilogo.jpg'
import instagram_icon from '../Assets/instagram_icon.png'
import pintester_icon from '../Assets/pintester_icon.png'
import whatsapp_icon from '../Assets/whatsapp_icon.png'
import { useToast } from '../Toast/ToastProvider'

const Footer = () => {
  const toast = useToast()

  const comingSoon = (label) => () => toast?.info(`${label} page is coming soon. Stay tuned!`)

  return (
    <div className='footer'>
      <div className='footer-logo'>
        <img src={pickziLogo} alt="Pickzi logo" />
        <p>PICKZI-Pick Click Done</p>
      </div>
      <ul className="footer-link">
        <li><button type='button' onClick={comingSoon('Company')} className='footer-link-btn'>Company</button></li>
        <li><button type='button' onClick={comingSoon('Products')} className='footer-link-btn'>Products</button></li>
        <li><button type='button' onClick={comingSoon('Offices')} className='footer-link-btn'>Offices</button></li>
        <li><button type='button' onClick={comingSoon('About')} className='footer-link-btn'>About</button></li>
        <li><button type='button' onClick={() => window.open('mailto:support@pickzi.com')} className='footer-link-btn'>Contact</button></li>
      </ul>
      <div className="footer-social-icon">
        <button type='button' className="footer-icons-container" onClick={() => window.open('https://instagram.com', '_blank')}
          aria-label='Instagram'>
          <img src={instagram_icon} alt="instagram"/>
        </button>
        <button type='button' className="footer-icons-container" onClick={() => window.open('https://pinterest.com', '_blank')}
          aria-label='Pinterest'>
          <img src={pintester_icon} alt="pinterest"/>
        </button>
        <button type='button' className="footer-icons-container" onClick={() => window.open('https://wa.me/1234567890', '_blank')}
          aria-label='WhatsApp'>
          <img src={whatsapp_icon} alt="whatsapp"/>
        </button>
      </div>
      <div className="footer-copyright">
        <hr/>
        <p>Copyright © 2025 - All Rights Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
