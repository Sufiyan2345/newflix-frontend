import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { TitleCard } from '../components/Row';
import { IconTrash } from '../components/Icons';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';

export default function History() {
  const [items, setItems] = useState(null);
  const nav = useNavigate();
  const { activeProfile } = useAuth();

  useEffect(() => {
    document.title = 'Watch History — Newflix';
    if (!activeProfile) {
      setItems([]);
      return;
    }
    API.get('/user/history').then(({ data }) => setItems(data.items)).catch(() => setItems([]));
  }, [activeProfile]);

  const remove = async (entry, event) => {
    if (event) event.stopPropagation();
    try {
      if (entry.sourceType === 'tmdb') {
        await API.delete(`/user/history/tmdb/${entry.tmdbId}`);
      } else if (entry.title?._id) {
        await API.delete(`/user/history/${entry.title._id}`);
      } else {
        return;
      }
      setItems((s) => s.filter((i) => i._id !== entry._id));
    } catch (error) {
      console.error('Failed to remove history item', error);
      alert('Unable to delete this item right now.');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="grid-page">
        <h2>Watch History</h2>
        {items === null && <PageLoadingSkeleton variant="grid" cardCount={5} />}
        {items && items.length === 0 && <p className="no-results">Nothing watched yet.</p>}
        {items && items.length > 0 && (
          <div className="grid">
            {items.map((h) => (
              <div key={h._id} className="history-card" style={{ position: 'relative' }}>
                <TitleCard item={{ ...h.title, ...(h.watchRoute ? { watchRoute: h.watchRoute } : {}) }} progress={h} onHover={() => {}} />
                {h.progressSeconds > 0 && h.durationSeconds > 0 && (
                  <div className="progress-bar" style={{ left: 8, right: 8 }}>
                    <span style={{ width: `${Math.min(100, (h.progressSeconds / h.durationSeconds) * 100)}%` }} />
                  </div>
                )}
                <button
                  type="button"
                  className="history-delete-btn"
                  onClick={(event) => remove(h, event)}
                  title="Remove from watch history"
                  aria-label={`Delete ${h.title?.title || 'this title'} from watch history`}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.72)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                  }}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
