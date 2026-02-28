import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function HealthTips() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('homeopathy');
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [flipped, setFlipped] = useState({});
  const [favourites, setFavourites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_cards') || '[]');
    } catch {
      return [];
    }
  });
  const [showFavs, setShowFavs] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [tab]);

  async function fetchCards() {
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .in('clinic_type', [tab, 'both'])
      .eq('is_active', true)
      .order('display_order');
    setCards(data || []);
  }

  function toggleFlip(id) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleFav(id) {
    const newFavs = favourites.includes(id)
      ? favourites.filter((f) => f !== id)
      : [...favourites, id];
    setFavourites(newFavs);
    localStorage.setItem('fav_cards', JSON.stringify(newFavs));
  }

  const isHomeo = tab === 'homeopathy';
  const theme = isHomeo
    ? { accent: '#1565C0', btn: '#42A5F5', bg: '#E3F2FD' }
    : { accent: '#2E7D32', btn: '#66BB6A', bg: '#E8F5E9' };

  const filtered = cards.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFav = showFavs ? favourites.includes(c.id) : true;
    return matchSearch && matchFav;
  });

  return (
    <div
      className="page"
      style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}
    >
      <div
        className="header"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
      >
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
          Health Tips
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          background: 'white',
          borderBottom: '1px solid #eee',
        }}
      >
        {['homeopathy', 'leanlife'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSearch('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              background:
                tab === t
                  ? t === 'homeopathy'
                    ? '#E3F2FD'
                    : '#E8F5E9'
                  : 'white',
              color:
                tab === t
                  ? t === 'homeopathy'
                    ? '#1565C0'
                    : '#2E7D32'
                  : '#888',
              fontWeight: tab === t ? 700 : 400,
              fontSize: 14,
              cursor: 'pointer',
              borderBottom: `3px solid ${
                tab === t
                  ? t === 'homeopathy'
                    ? '#1565C0'
                    : '#2E7D32'
                  : 'transparent'
              }`,
            }}
          >
            {t === 'homeopathy' ? '🌿 Homeopathy' : '🥗 LeanLife'}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="input"
            placeholder="🔍 Search health tips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, borderColor: theme.accent + '40' }}
          />
          <button
            onClick={() => setShowFavs(!showFavs)}
            style={{
              padding: '0 14px',
              border: `2px solid ${showFavs ? '#E91E63' : '#eee'}`,
              borderRadius: 12,
              background: showFavs ? '#FCE4EC' : 'white',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            {showFavs ? '❤️' : '🤍'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>💡</div>
            <p>
              {showFavs ? 'No favourites saved yet' : 'No health tips found'}
            </p>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            {filtered.map((card) => (
              <div key={card.id} style={{ perspective: 1000, height: 220 }}>
                <div
                  onClick={() => toggleFlip(card.id)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.6s',
                    transformStyle: 'preserve-3d',
                    transform: flipped[card.id]
                      ? 'rotateY(180deg)'
                      : 'rotateY(0deg)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    }}
                  >
                    {card.front_image_url && (
                      <img
                        src={card.front_image_url}
                        alt=""
                        style={{
                          width: '100%',
                          height: 110,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <div style={{ padding: '10px 12px' }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: theme.accent,
                          marginBottom: 4,
                          lineHeight: 1.3,
                        }}
                      >
                        {card.title}
                      </p>
                      <p
                        style={{ fontSize: 11, color: '#777', lineHeight: 1.4 }}
                      >
                        {card.front_description?.substring(0, 60)}
                        {card.front_description?.length > 60 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(card.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {favourites.includes(card.id) ? '❤️' : '🤍'}
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 10,
                        fontSize: 10,
                        color: '#bbb',
                      }}
                    >
                      Tap to flip →
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      borderRadius: 16,
                      background: theme.bg,
                      transform: 'rotateY(180deg)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: theme.accent,
                        marginBottom: 8,
                      }}
                    >
                      {card.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#444',
                        lineHeight: 1.5,
                        flex: 1,
                        overflowY: 'auto',
                      }}
                    >
                      {card.back_content}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: '#999',
                        marginTop: 8,
                        textAlign: 'right',
                      }}
                    >
                      ← Tap to flip back
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
