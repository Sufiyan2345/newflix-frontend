import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TmdbDetailModal from '../components/TmdbDetailModal';
import PageLoadingSkeleton from '../components/PageLoadingSkeleton';
import Footer from '../components/Footer';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { getTmdbList, toggleTmdbList } from '../utils/tmdbList';
import { IconTrash } from '../components/Icons';
import { CardArt, TmdbArtworkLogo } from '../components/Row';
import { useSiteTranslation } from '../utils/siteTranslation';

function MyListCard({ item, onRemove }) {
  const nav = useNavigate();
  const isTmdb = String(item._id || '').startsWith('tmdb-');
  const open = () => {
    if (isTmdb) window.dispatchEvent(new CustomEvent('tmdb-open-detail', { detail: item }));
    else nav(`/title/${item.slug}`);
  };

  return (
    <article className="my-list-card" onClick={open}>
      <div className="my-list-art">
        <CardArt src={item.bannerUrl || item.posterUrl} alt={item.title} title={item.title} />
        <img className="card-brand-badge" src="/Netflix.png" alt="Netflix" />
        {isTmdb && <TmdbArtworkLogo item={item} />}
        <button
          className="my-list-remove"
          title={`Remove ${item.title} from My List`}
          aria-label={`Remove ${item.title} from My List`}
          onClick={(e) => { e.stopPropagation(); onRemove(item); }}
        >
          <IconTrash size={14} />
        </button>
      </div>
      <h3>{item.title}</h3>
    </article>
  );
}

export default function MyList() {
  const t = useSiteTranslation();
  const { activeProfile } = useAuth();
  const [items, setItems] = useState(null);
  const [tmdbItems, setTmdbItems] = useState([]);
  const [tmdbDetail, setTmdbDetail] = useState(null);

  useEffect(() => {
    document.title = 'My List — Newflix';
    API.get('/user/watchlist').then(({ data }) => setItems(data.items)).catch(() => setItems([]));
  }, []);

  // TMDB items saved with the + button on any card (stored per profile locally)
  useEffect(() => {
    const load = () => setTmdbItems(getTmdbList(activeProfile?._id));
    load();
    window.addEventListener('tmdb-list-changed', load);
    return () => window.removeEventListener('tmdb-list-changed', load);
  }, [activeProfile?._id]);

  useEffect(() => {
    const onOpen = (e) => setTmdbDetail(e.detail);
    window.addEventListener('tmdb-open-detail', onOpen);
    return () => window.removeEventListener('tmdb-open-detail', onOpen);
  }, []);

  const empty = items && items.length === 0 && tmdbItems.length === 0;

  const removeTmdb = (item) => toggleTmdbList(activeProfile?._id, item);
  const removeLocal = async (item) => {
    const previousItems = items;
    setItems((current) => (current || []).filter((entry) => entry.title?._id !== item._id));
    try {
      await API.delete(`/user/watchlist/${item._id}`);
    } catch { setItems(previousItems); }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="grid-page">
        <h2>{t('My List')}</h2>
        {items === null && <PageLoadingSkeleton variant="grid" cardCount={5} />}
        {empty && (
          <p className="no-results">{t('Your list is empty. Add movies and series with the + button.')}</p>
        )}
        {tmdbItems.length > 0 && (
          <>
            {items && items.length > 0 && <h3 className="list-section-title">From TMDB</h3>}
            <div className="grid">
              {tmdbItems.map((t) => (
                <MyListCard key={t._id} item={t} onRemove={removeTmdb} />
              ))}
            </div>
          </>
        )}
        {items && items.length > 0 && (
          <>
            {tmdbItems.length > 0 && <h3 className="list-section-title">From Your Library</h3>}
            <div className="grid">
              {items.map((w) => <MyListCard key={w._id} item={w.title} onRemove={removeLocal} />)}
            </div>
          </>
        )}
      </div>
      {tmdbDetail && <TmdbDetailModal item={tmdbDetail} onClose={() => setTmdbDetail(null)} />}
      <Footer />
    </div>
  );
}
