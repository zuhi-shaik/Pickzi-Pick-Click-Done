import React, { useState } from 'react'
import './NewsLetter.css'
import { useToast } from '../Toast/ToastProvider'

const NewsLetter = () => {
  const [email, setEmail] = useState('')
  const toast = useToast()

  const onSubscribe = () => {
    const trimmed = email.trim()
    if (!trimmed) {
      toast?.error('Please enter your email address before subscribing.')
      return
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(trimmed)) {
      toast?.error('That email looks invalid. Try again?')
      return
    }
    toast?.success('Thanks for subscribing! We will send the best offers your way.')
    setEmail('')
  }

  return (
    <div className='newsletter'>
      <h1>Get Exclusive Offers On Your Email</h1>
      <p>Subscribe to our newletter and stay updated</p>
      <div>
        <input
          type="email"
          placeholder='Enter Your Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="button" onClick={onSubscribe}>Subscribe</button>
      </div>
    </div>
  )
}

export default NewsLetter
