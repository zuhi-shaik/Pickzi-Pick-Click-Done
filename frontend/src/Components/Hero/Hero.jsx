import React from 'react'
import './Hero.css'
import hand_icon from '../Assets/hand_icon.png'
import arrow_icon from '../Assets/arrow.png'
import hero_image from '../Assets/hero_image.png'
import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className='hero'>
      <div className="hero-gradient"></div>
      <div className="hero-shell">
        <div className="hero-copy glass-card">
          <span className="badge">Just dropped</span>
          <h1>Discover drops curated for you</h1>
          <p>
            Explore freshly added outfits and accessories from top designers. Build the
            wardrobe you love with personalised picks and early access deals.
          </p>
          <div className="hero-actions">
            <Link to="/#new-collections" className="pill-button hero-primary">
              Shop new arrivals
              <img src={arrow_icon} alt="" />
            </Link>
            <Link to="/search" className="hero-secondary">
              Explore collections
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span>5K+</span>
              <small>curated styles</small>
            </div>
            <div className="hero-stat">
              <span>24hr</span>
              <small>flash deals weekly</small>
            </div>
            <div className="hero-stat">
              <span>4.8★</span>
              <small>customer reviews</small>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card glass-card">
            <img src={hero_image} alt="Latest collection" />
            <div className="hero-card-copy">
              <div className="hero-hand-icon">
                <p>new</p>
                <img src={hand_icon} alt="" />
              </div>
              <h3>Statement layers</h3>
              <p>Blend soft textures with bold silhouettes from our winter edit.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
