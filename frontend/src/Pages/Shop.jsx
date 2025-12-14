import React, { useEffect } from 'react'
import Hero from '../Components/Hero/Hero'
import Popular from '../Components/Popular/Popular'
import Offers from '../Components/Offers/Offers'
import NewCollections from '../Components/NewCollections/NewCollections'
import NewsLetter from '../Components/NewsLetter/NewsLetter'
import { Link, useLocation } from 'react-router-dom'
import womenImg from '../Components/Assets/product_1.png'
import menImg from '../Components/Assets/product_13.png'
import kidsImg from '../Components/Assets/product_25.png'
import './CSS/Shop.css'

const Shop = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#new-collections') {
      // wait a tick for the section to be in the DOM
      setTimeout(() => {
        const el = document.getElementById('new-collections');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [location]);
  return (
    <div className='shop-page'>
      <Hero />

      <section className='section shop-browse'>
        <div className='shop-browse-heading'>
          <span className='badge'>Shop by category</span>
          <h2 className='section-title'>Find the perfect look for every moment</h2>
          <span>Curated edits from our stylists – discover trending fits for women, men, and kids.</span>
        </div>
        <div className='shop-category-grid'>
          <article className='shop-category-card'>
            <img src={womenImg} alt='Women category' />
            <footer>
              <h3>Women</h3>
              <Link to='/Women'><button className='pill-button'>View all</button></Link>
            </footer>
          </article>
          <article className='shop-category-card'>
            <img src={menImg} alt='Men category' />
            <footer>
              <h3>Men</h3>
              <Link to='/Men'><button className='pill-button'>View all</button></Link>
            </footer>
          </article>
          <article className='shop-category-card'>
            <img src={kidsImg} alt='Kids category' />
            <footer>
              <h3>Kids</h3>
              <Link to='/Kids'><button className='pill-button'>View all</button></Link>
            </footer>
          </article>
        </div>
      </section>

      <Popular />
      <Offers />
      <NewCollections />
      <NewsLetter />
    </div>
  )
}

export default Shop
