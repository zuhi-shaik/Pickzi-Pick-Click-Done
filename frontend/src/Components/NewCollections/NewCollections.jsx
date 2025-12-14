// frontend/src/Components/NewCollections/NewCollections.jsx
import React, { useContext, useMemo } from 'react';
import './NewCollections.css';
import new_collections from '../Assets/new_collections.js';
import Item from '../Item/Item';
import { ShopContext } from '../../Context/ShopContext';

const NewCollections = () => {
  const { all_product } = useContext(ShopContext);

  const items = useMemo(() => {
    if (Array.isArray(all_product) && all_product.length) {
      const sorted = [...all_product].sort((a, b) => {
        const timeA = Date.parse(a?.createdAt ?? '') || 0;
        const timeB = Date.parse(b?.createdAt ?? '') || 0;
        if (timeB !== timeA) return timeB - timeA;
        return String(b?._id || b?.id || '').localeCompare(String(a?._id || a?.id || ''));
      });
      return sorted.slice(0, 8);
    }
    return new_collections;
  }, [all_product]);

  return (
    <div className='new-collections' id="new-collections">
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
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
  );
};

export default NewCollections;
