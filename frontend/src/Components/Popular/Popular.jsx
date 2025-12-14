import React, { useContext, useMemo } from 'react'
import './Popular.css'
import data_product from '../Assets/data'
import Item from '../Item/Item'
import { ShopContext } from '../../Context/ShopContext'

const Popular = () => {
  const { all_product } = useContext(ShopContext)

  const items = useMemo(() => {
    const women = (Array.isArray(all_product) ? all_product : []).filter((p) => p?.category === 'women')
    if (women.length) {
      return [...women]
        .sort((a, b) => {
          const ratingDiff = (b?.rating || 0) - (a?.rating || 0)
          if (ratingDiff !== 0) return ratingDiff
          return (b?.new_price || 0) - (a?.new_price || 0)
        })
        .slice(0, 4)
    }
    return data_product
  }, [all_product])

  return (
    <div className='popular'>
      <div className='popular-heading'>
        <span className='badge'>Trending now</span>
        <h1>Popular in Women</h1>
        <p>Handpicked favourites loved by our community this week.</p>
      </div>
      <div className="popular-item">
        {items.map((item, i) => (
          <Item
            key={item.id || item._id || i}
            id={item.id || item._id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}
      </div>
    </div>
  )
}

export default Popular