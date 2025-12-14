import React, { useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ShopContext } from '../Context/ShopContext';
import Item from '../Components/Item/Item';

const useQuery = () => {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
};

const Search = () => {
  const { all_product } = useContext(ShopContext);
  const qs = useQuery();
  const q = (qs.get('q') || '').trim();

  const results = useMemo(() => {
    const term = q.toLowerCase();
    if (!term) return [];
    return (all_product || []).filter(p => {
      const hay = [p.name, p.category, p.description]
        .filter(Boolean)
        .join(' ') 
        .toLowerCase();
      return hay.includes(term);
    });
  }, [all_product, q]);

  return (
    <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
      <h2 style={{ margin: '8px 0 16px' }}>
        Search results{q ? ` for "${q}"` : ''} ({results.length})
      </h2>
      {!q && (
        <div style={{ color: '#666' }}>Type a query in the search box above and press Search.</div>
      )}
      {q && results.length === 0 && (
        <div style={{ color: '#666' }}>No products found. Try a different keyword.</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
        {results.map(item => (
          <Item
            key={item.id}
            id={item.id}
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

export default Search;
