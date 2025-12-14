import React, { useContext, useMemo, useState, useEffect, useRef } from 'react'
import './CSS/ShopCategory.css'
import { ShopContext } from '../Context/ShopContext'
import dropdown_icon from "../Components/Assets/dropdown_icon.png";
import Item from '../Components/Item/Item'

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest Collections' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best', label: 'Best Sellers' },
];

const ShopCategory = (props) => {
  const { all_product, productError } = useContext(ShopContext);

  // derive available categories/sizes/colors from data
  const allCategories = useMemo(() => Array.from(new Set((all_product||[]).map(p => p.category))), [all_product]);
  const allSizes = useMemo(() => Array.from(new Set((all_product||[]).flatMap(p => p.sizes || []))), [all_product]);
  const allColors = useMemo(() => Array.from(new Set((all_product||[]).flatMap(p => p.colors || []))), [all_product]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategories, setSelectedCategories] = useState(props.category ? [props.category] : allCategories);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [dealsOnly, setDealsOnly] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    if (props.category) {
      setSelectedCategories([props.category]);
    } else {
      setSelectedCategories(allCategories);
    }
    // reset size/color filters when category changes to avoid stale selections
    setSizes([]);
    setColors([]);
  }, [props.category, allCategories]);

  useEffect(() => {
    setSortMenuOpen(false);
  }, [sortBy]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const handleClickAway = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [sortMenuOpen]);

  const toggleInArray = (arr, value, setter) => {
    if (arr.includes(value)) setter(arr.filter(v => v !== value));
    else setter([...arr, value]);
  };

  const filtered = useMemo(() => {
    const min = priceMin === '' ? -Infinity : Number(priceMin);
    const max = priceMax === '' ? Infinity : Number(priceMax);
    const minR = minRating === '' ? -Infinity : Number(minRating);
    return (all_product || []).filter(p => {
      if (selectedCategories.length && !selectedCategories.includes(p.category)) return false;
      if (!(p.new_price >= min && p.new_price <= max)) return false;
      if (dealsOnly && !(p.old_price && p.new_price < p.old_price)) return false;
      if (!(typeof p.rating !== 'number' || p.rating >= minR)) return false;
      if (inStockOnly && !(typeof p.stock === 'number' && p.stock > 0)) return false;
      if (sizes.length && !(p.sizes || []).some(s => sizes.includes(s))) return false;
      if (colors.length && !(p.colors || []).some(c => colors.includes(c))) return false;
      return true;
    });
  }, [all_product, selectedCategories, priceMin, priceMax, dealsOnly, minRating, inStockOnly, sizes, colors]);

  const latestKeys = useMemo(() => {
    if (!Array.isArray(all_product)) return [];
    const getTime = (value) => {
      const parsed = Date.parse(value ?? '');
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const list = [...all_product].sort((a, b) => {
      const diff = getTime(b?.createdAt) - getTime(a?.createdAt);
      if (diff !== 0) return diff;
      return String(b?._id || b?.id || '').localeCompare(String(a?._id || a?.id || ''));
    });
    return list.slice(0, 12).map((p) => String(p?._id || p?.id || ''));
  }, [all_product]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const latestSet = new Set(latestKeys);
    if (sortBy === 'price-asc') arr.sort((a,b)=> (a.new_price||0) - (b.new_price||0));
    else if (sortBy === 'price-desc') arr.sort((a,b)=> (b.new_price||0) - (a.new_price||0));
    else if (sortBy === 'newest') arr.sort((a,b)=> (b.id||0) - (a.id||0));
    else if (sortBy === 'best') arr.sort((a,b)=> (b.rating||0) - (a.rating||0));
    else if (sortBy === 'latest') {
      arr.sort((a,b)=> {
        const aKey = String(a?._id || a?.id || '');
        const bKey = String(b?._id || b?.id || '');
        const aLatest = latestSet.has(aKey) ? 1 : 0;
        const bLatest = latestSet.has(bKey) ? 1 : 0;
        if (aLatest !== bLatest) return bLatest - aLatest;
        const getTime = (value) => {
          const parsed = Date.parse(value ?? '');
          return Number.isFinite(parsed) ? parsed : 0;
        };
        const diff = getTime(b?.createdAt) - getTime(a?.createdAt);
        if (diff !== 0) return diff;
        return bKey.localeCompare(aKey);
      });
    }
    return arr;
  }, [filtered, sortBy, latestKeys]);

  const totalCount = useMemo(() => (all_product||[]).length, [all_product]);
  const activeSort = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0];

  return (
    <div className='shop-category'>
      <img className='shopcategory-banner' src={props.banner} alt="" />

      {productError ? (
        <div className="shopcategory-error">
          <strong>Heads up:</strong> {productError}
        </div>
      ) : null}

      <div className="shopcategory-indexSort">
        <p>
          <span>Showing {filtered.length}</span> out of {totalCount} products
        </p>
        <div className="shopcategory-controls">
          <div className={`shopcategory-sort ${sortMenuOpen ? 'is-open' : ''}`} ref={sortMenuRef}>
            <button
              type="button"
              className="shopcategory-sort-toggle"
              onClick={() => setSortMenuOpen(open => !open)}
              aria-label={`Sort products${sortBy ? ` by ${activeSort.label}` : ''}`}
            >
              <span className="shopcategory-sort-label">Sort by</span>
              <img src={dropdown_icon} alt="Toggle sort menu" className="shopcategory-sort-icon" />
            </button>
            {sortMenuOpen && (
              <div className="shopcategory-sort-menu">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`shopcategory-sort-option ${opt.value === sortBy ? 'is-active' : ''}`}
                    onClick={() => setSortBy(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="shopcategory-filter-btn" onClick={() => setFiltersOpen(o => !o)}>
            Filters
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="filters-panel">
          <div className="filter-group">
            <div className="filter-title">Categories</div>
            <div className="filter-options">
              {allCategories.map(cat => (
                <label key={cat} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleInArray(selectedCategories, cat, setSelectedCategories)}
                  /> {cat}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-title">Price</div>
            <div className="filter-row">
              <input placeholder="Min" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
              <span>-</span>
              <input placeholder="Max" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input type="checkbox" checked={dealsOnly} onChange={e=>setDealsOnly(e.target.checked)} /> Deals
            </label>
          </div>

          <div className="filter-group">
            <div className="filter-title">Customer Reviews</div>
            <select value={minRating} onChange={e=>setMinRating(e.target.value)}>
              <option value="">All ratings</option>
              <option value="4">4★ & up</option>
              <option value="3">3★ & up</option>
              <option value="2">2★ & up</option>
              <option value="1">1★ & up</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input type="checkbox" checked={inStockOnly} onChange={e=>setInStockOnly(e.target.checked)} /> In stock
            </label>
          </div>

          {!!allSizes.length && (
            <div className="filter-group">
              <div className="filter-title">Sizes</div>
              <div className="filter-options">
                {allSizes.map(s => (
                  <label key={s} className="filter-checkbox">
                    <input type="checkbox" checked={sizes.includes(s)} onChange={()=>toggleInArray(sizes, s, setSizes)} /> {s}
                  </label>
                ))}
              </div>
            </div>
          )}

          {!!allColors.length && (
            <div className="filter-group">
              <div className="filter-title">Colours</div>
              <div className="filter-options">
                {allColors.map(c => (
                  <label key={c} className="filter-checkbox">
                    <input type="checkbox" checked={colors.includes(c)} onChange={()=>toggleInArray(colors, c, setColors)} /> {c}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="shopcategory-products">
        {sorted.map((item) => (
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
  )
}

export default ShopCategory;
