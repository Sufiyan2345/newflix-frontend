import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';

const relativeTime = (value) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function SocialSidebar() {
  const navigate = useNavigate();
  const { user, profiles, activeProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((value) => !value);
    window.addEventListener('social-sidebar-toggle', toggle);
    return () => window.removeEventListener('social-sidebar-toggle', toggle);
  }, []);

  useEffect(() => {
    if (!user || !activeProfile) return;
    API.get('/user/history').then(({ data }) => setHistory(data.items || [])).catch(() => setHistory([]));
  }, [user, activeProfile?._id]);

  if (!user || !activeProfile || !open) return null;
  const friends = (profiles || []).slice(0, 6);

  return (
    <aside className="social-sidebar" aria-label="Friends and recent activity">
      <section className="social-section">
        <div className="social-section-head"><h2>Active Friends ({Math.max(friends.length, 0)})</h2><button type="button" onClick={() => navigate('/profiles')}>See All</button></div>
        <div className="friend-list">
          {friends.map((profile) => (
            <button className="friend-row" key={profile._id} type="button" onClick={() => navigate('/profiles')}>
              <div className="friend-avatar" style={{ background: profile.avatarColor || '#b1060f' }}>
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.name?.charAt(0) || 'U'}
                <i />
              </div>
              <div><strong>{profile.name}</strong><small>@{profile.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}</small></div>
            </button>
          ))}
          {!friends.length && <p className="social-empty">Add profiles to see friends here.</p>}
        </div>
      </section>
      <section className="social-section activity-section">
        <button className="social-activity-heading" type="button" onClick={() => navigate('/history')}>Recent Activity</button>
        <div className="activity-list">
          {history.map((entry) => (
            <button className="activity-row" key={entry._id} type="button" onClick={() => entry.title?.slug && navigate(`/title/${entry.title.slug}`)}>
              <img src={entry.title.posterUrl || entry.title.bannerUrl} alt="" />
              <div><span>Watched <b>{entry.title.title}</b></span><small>{relativeTime(entry.lastWatchedAt)}</small></div>
            </button>
          ))}
          {!history.length && <p className="social-empty">Your watched titles will appear here.</p>}
        </div>
      </section>
    </aside>
  );
}
