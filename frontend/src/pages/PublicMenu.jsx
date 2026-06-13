import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function PublicMenu() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') || '';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/products/public-menu`)
      .then(r => r.json())
      .then(data => {
        // Filter out empty categories
        const filled = data.filter(c => c.products && c.products.length > 0);
        setCategories(filled);
        if (filled.length > 0) setActiveCategory(filled[0].id);
      })
      .catch(() => setError('Could not load menu. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleCategory = categories.find(c => c.id === activeCategory);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading menu…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>☕ Café Menu</div>
          {tableNumber && (
            <div style={styles.tableBadge}>Table {tableNumber}</div>
          )}
        </div>
        <p style={styles.subtext}>Browse our freshly prepared items</p>
      </header>

      {/* Category Tabs */}
      <div style={styles.tabsWrap}>
        <div style={styles.tabs}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                ...styles.tab,
                ...(activeCategory === cat.id ? styles.tabActive : {}),
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <main style={styles.main}>
        {visibleCategory ? (
          <div style={styles.grid}>
            {visibleCategory.products.map(product => (
              <div key={product.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.productName}>{product.name}</div>
                  <div style={styles.productPrice}>
                    ₹{parseFloat(product.price).toFixed(2)}
                  </div>
                </div>
                {product.description && (
                  <p style={styles.productDesc}>{product.description}</p>
                )}
                <div style={styles.cardFooter}>
                  {product.unitOfMeasure && product.unitOfMeasure !== 'piece' && (
                    <span style={styles.tag}>{product.unitOfMeasure}</span>
                  )}
                  {product.tax > 0 && (
                    <span style={styles.tag}>+{product.tax}% tax</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyMsg}>No items available right now.</div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Please place your order at the counter or with our staff.</p>
        <p style={{ marginTop: 4, opacity: 0.4, fontSize: 11 }}>Prices are inclusive of applicable taxes unless stated.</p>
      </footer>
    </div>
  );
}

/* ── Inline styles (no Tailwind dependency for public page) ── */
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
    color: '#f1f1f1',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  loadingWrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100vh', gap: 16,
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid #333',
    borderTop: '3px solid #f97316',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#888', fontSize: 14 },
  errorBox: {
    maxWidth: 400, margin: '80px auto', padding: 24,
    background: '#2a1010', border: '1px solid #7f1d1d',
    borderRadius: 12, color: '#fca5a5', textAlign: 'center',
  },
  header: {
    background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
    padding: '24px 20px 16px',
  },
  headerInner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    maxWidth: 640, margin: '0 auto',
  },
  logo: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
  tableBadge: {
    background: 'rgba(0,0,0,0.25)', color: '#fff',
    fontSize: 13, fontWeight: 600, padding: '4px 12px',
    borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
  },
  subtext: {
    maxWidth: 640, margin: '8px auto 0',
    color: 'rgba(255,255,255,0.8)', fontSize: 13,
  },
  tabsWrap: {
    background: '#111', borderBottom: '1px solid #222',
    overflowX: 'auto',
  },
  tabs: {
    display: 'flex', gap: 4, padding: '12px 16px',
    maxWidth: 640, margin: '0 auto',
    minWidth: 'max-content',
  },
  tab: {
    background: '#1e1e1e', border: '1px solid #333',
    color: '#aaa', borderRadius: 20, padding: '6px 16px',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
  tabActive: {
    background: '#f97316', borderColor: '#f97316',
    color: '#fff',
  },
  main: { maxWidth: 640, margin: '0 auto', padding: '20px 16px' },
  grid: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 14, padding: '16px 18px',
    transition: 'border-color 0.2s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  productName: { fontSize: 16, fontWeight: 600, color: '#f1f1f1', flex: 1 },
  productPrice: {
    fontSize: 16, fontWeight: 700, color: '#f97316',
    whiteSpace: 'nowrap',
  },
  productDesc: {
    fontSize: 13, color: '#888', marginTop: 6, lineHeight: 1.5,
  },
  cardFooter: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  tag: {
    fontSize: 11, background: '#2a2a2a', color: '#666',
    borderRadius: 6, padding: '2px 8px', border: '1px solid #333',
  },
  emptyMsg: { textAlign: 'center', color: '#555', padding: '48px 0' },
  footer: {
    textAlign: 'center', padding: '24px 16px',
    color: '#444', fontSize: 12, borderTop: '1px solid #1e1e1e',
  },
};
