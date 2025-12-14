import React from 'react'
import './Offers.css'
import exclusive_image from '../Assets/exclusive_image.png'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../Toast/ToastProvider'

const Offers = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const goBestSellers = () => navigate('/search?sort=popular')
  const goRewards = () => {
    toast?.info('Rewards are coming soon! Meanwhile, keep shopping to earn points.')
  }

  return (
    <section className='offers section-shell'>
      <div className='offers-card glass-card'>
        <div className='offers-copy'>
          <span className='badge'>Limited time</span>
          <h2>Exclusive offers curated for you</h2>
          <p>Save up to 40% on best sellers and earn double reward points when you checkout within the next 24 hours.</p>
          <div className='offers-actions'>
            <button className='pill-button' type='button' onClick={goBestSellers}>Shop best sellers</button>
            <button className='auth-secondary-button' type='button' onClick={goRewards}>View rewards</button>
          </div>
        </div>
        <div className='offers-visual'>
          <img src={exclusive_image} alt="Exclusive offer" />
        </div>
      </div>
    </section>
  )
}

export default Offers
