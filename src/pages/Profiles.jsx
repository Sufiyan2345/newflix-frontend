import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../api';
import { IconChevronRight, IconInfo, IconSettings, IconUsers } from '../components/Icons';

const COLORS = ['#E50914', '#E87C03', '#2E86AB', '#7D4CBE', '#1F9D55'];
const AVATAR_OPTIONS = [
  '/Netflix-avatar-1.png',
  '/Netflix-avatar-2-300x300.png',
  '/Netflix-avatar-3-300x300.png',
  '/Netflix-avatar-4-300x300.png',
  '/Netflix-avatar-5-300x300.png',
  '/Netflix-avatar-6-300x300.png',
  '/Netflix-avatar-7-300x300.png',
  '/Netflix-avatar-8-300x300.png',
  '/Netflix-avatar-9-300x300.png',
  '/Netflix-avatar-10-300x300.png',
  '/Netflix-avatar-11-300x300.png',
  '/Netflix-avatar-12-300x300.png',
];

const normalizeAvatarUrl = (value) => {
  if (!value || typeof value !== 'string') return AVATAR_OPTIONS[0];
  const trimmed = value.trim();
  if (!trimmed) return AVATAR_OPTIONS[0];
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed.replace(/^\.?\//, '')}`;
};

const resolveAvatarUrl = (profile) => normalizeAvatarUrl(profile?.avatarUrl);

export default function Profiles() {
  const { user, profiles, activeProfile, selectProfile, loadMe } = useAuth();
  const [manage, setManage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [kids, setKids] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_OPTIONS[0]);
  const [editProfile, setEditProfile] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);
  const [editAvatarUrl, setEditAvatarUrl] = useState(AVATAR_OPTIONS[0]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadMessage, setAvatarUploadMessage] = useState('');
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const avatarInputRef = useRef(null);
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('sf_profiles_theme') === 'dark');
  const nav = useNavigate();
  const [params] = useSearchParams();
  const settingsView = params.get('settings') === '1';

  const openEditProfile = (p) => {
    setEditProfile(p);
    setEditName(p.name || '');
    setEditColor(p.avatarColor || COLORS[0]);
    setEditAvatarUrl(resolveAvatarUrl(p));
    setAvatarUploadMessage('');
    setAvatarUploadError('');
  };

  const closeEditProfile = () => {
    setEditProfile(null);
    setEditName('');
    setEditColor(COLORS[0]);
    setEditAvatarUrl(AVATAR_OPTIONS[0]);
    setAvatarUploading(false);
    setAvatarUploadMessage('');
    setAvatarUploadError('');
  };

  const uploadProfileAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarUploadError('Choose a PNG, JPG, WEBP, or GIF image.');
      setAvatarUploadMessage('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError('Choose an image smaller than 5 MB.');
      setAvatarUploadMessage('');
      return;
    }

    setAvatarUploading(true);
    setAvatarUploadError('');
    setAvatarUploadMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await API.post('/upload/profile-image', formData);
      setEditAvatarUrl(data.url);
      setAvatarUploadMessage('Photo ready. Save to apply it to this profile.');
    } catch (err) {
      setAvatarUploadError(err.response?.data?.message || 'Could not upload this image. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const renderAvatarUpload = () => (
    <div className="profile-avatar-upload">
      <input
        ref={avatarInputRef}
        className="profile-avatar-upload-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={uploadProfileAvatar}
        aria-label="Choose a profile photo"
      />
      <button type="button" className="profile-avatar-upload-button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
        {avatarUploading ? (
          <span className="profile-avatar-upload-spinner" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
            <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
        )}
        {avatarUploading ? 'Uploading photo' : 'Choose photo'}
      </button>
      <span className="profile-avatar-upload-hint">PNG, JPG, WEBP or GIF · Up to 5 MB</span>
      {avatarUploadMessage && <span className="profile-avatar-upload-success" role="status">{avatarUploadMessage}</span>}
      {avatarUploadError && <span className="profile-avatar-upload-error" role="alert">{avatarUploadError}</span>}
    </div>
  );

  const pick = (p) => {
    if (manage) return;
    selectProfile(p);
    nav('/browse');
  };

  const addProfile = async (e) => {
    e.preventDefault();
    try {
      await API.post('/user/profiles', { name, isKidsProfile: kids, avatarColor: color, avatarUrl });
      await loadMe();
      setAdding(false); setName(''); setKids(false); setColor(COLORS[0]); setAvatarUrl(AVATAR_OPTIONS[0]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create profile');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!editProfile) return;
    try {
      const cleanName = editName.trim();
      if (!cleanName) return alert('Profile name is required');
      await API.put(`/user/profiles/${editProfile._id}`, {
        name: cleanName,
        avatarColor: editColor,
        avatarUrl: normalizeAvatarUrl(editAvatarUrl),
        isKidsProfile: editProfile.isKidsProfile,
      });
      await loadMe();
      closeEditProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const delProfile = async (id) => {
    if (!window.confirm('Delete this profile? Its My List and history will also be deleted.')) return;
    try {
      await API.delete(`/user/profiles/${id}`);
      await loadMe();
      if (activeProfile?._id === id) selectProfile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete profile');
    }
  };

  const toggleTheme = () => {
    setDarkTheme((value) => {
      localStorage.setItem('sf_profiles_theme', value ? 'light' : 'dark');
      return !value;
    });
  };

  if (settingsView) {
    return (
      <div className={`profiles-settings-page${darkTheme ? ' is-dark' : ''}`}>
        <header className="profiles-settings-header">
          <button type="button" onClick={() => nav('/account')}>‹ <span>Back to Account</span></button>
          <img src="/newflix.png" alt="Netflix" />
          <button type="button" className="profiles-theme-toggle" onClick={toggleTheme}>{darkTheme ? 'Light theme' : 'Dark theme'}</button>
        </header>
        <main className="profiles-settings-main">
          <p className="profiles-settings-eyebrow">Account</p>
          <h1>Profiles</h1>
          <p className="profiles-settings-subtitle">Parental Controls and Permissions</p>

          <section className="profiles-settings-card profiles-permission-card">
            <button type="button" onClick={() => setManage(true)}><span className="profiles-setting-icon"><IconInfo size={18} /></span><span><b>Adjust parental controls</b><small>Set age ratings, block titles</small></span><IconChevronRight size={18} /></button>
            <button type="button" onClick={() => setManage(true)}><span className="profiles-setting-icon"><IconUsers size={18} /></span><span><b>Transfer a profile</b><small>Copy a profile to another account</small></span><IconChevronRight size={18} /></button>
          </section>

          <h2 className="profiles-settings-label">Profile Settings</h2>
          <section className="profiles-settings-card profiles-settings-list">
            {profiles.map((p) => (
              <button type="button" className="profiles-setting-profile" key={p._id} onClick={() => openEditProfile(p)}>
                <span className="profiles-setting-avatar"><img src={resolveAvatarUrl(p)} alt="" /></span>
                <b>{p.name}</b>
                <span className="profiles-setting-you">{p._id === activeProfile?._id ? 'Your profile' : p.isKidsProfile ? 'Kids profile' : ''}</span>
                <IconChevronRight size={18} />
              </button>
            ))}
            {profiles.length < 5 && !adding && <button type="button" className="profiles-add-bar" onClick={() => setAdding(true)}>Add Profile</button>}
            {adding && (
              <form className="profiles-add-form" onSubmit={addProfile}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" required maxLength={40} autoFocus />
                <label><input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} /> Kids profile</label>
                <div className="profiles-add-avatars">{AVATAR_OPTIONS.slice(0, 6).map((item) => <button type="button" key={item} className={avatarUrl === item ? 'selected' : ''} onClick={() => setAvatarUrl(item)}><img src={item} alt="" /></button>)}</div>
                <div className="profiles-add-actions"><button type="button" onClick={() => setAdding(false)}>Cancel</button><button type="submit">Create</button></div>
              </form>
            )}
          </section>
          {editProfile && (
            <div className="profile-edit-overlay" onClick={closeEditProfile}>
              <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profile-edit-header">Edit Profile</div>
                <div className="profile-edit-content">
                  <div className="profile-edit-avatar-wrap">
                    <div className="profile-edit-avatar" style={{ background: editColor }}><img src={normalizeAvatarUrl(editAvatarUrl)} alt={editName} /></div>
                    {renderAvatarUpload()}
                  </div>
                  <div className="profile-edit-form"><div className="profile-edit-field"><label htmlFor="profile-name-settings">Name</label><input id="profile-name-settings" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40} /></div><div className="profile-edit-actions"><button type="button" className="btn-gray" onClick={closeEditProfile}>Cancel</button><button type="button" className="btn-red" onClick={saveProfile} disabled={avatarUploading}>Save</button></div></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="profiles-page">
      <h1 className="profiles-title">{manage ? 'Manage Profiles:' : "Who's watching?"}</h1>
      <div className="profiles-grid">
        {profiles.map((p) => (
          <div key={p._id} className={`profile-item ${p.isKidsProfile ? 'kids' : ''}`} onClick={() => (manage ? openEditProfile(p) : pick(p))}>
            {manage && (
              <div className="profile-actions" onClick={(e) => e.stopPropagation()}>
                <button className="profile-action profile-edit-btn" onClick={() => openEditProfile(p)} title="Edit profile">✎</button>
                <button className="profile-action profile-delete-btn" onClick={() => delProfile(p._id)} title="Delete profile">⌫</button>
              </div>
            )}
            <div className="avatar" style={{ background: p.avatarColor || '#E50914' }}>
              {resolveAvatarUrl(p) ? (
                <img
                  src={resolveAvatarUrl(p)}
                  alt={p.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = AVATAR_OPTIONS[0];
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : p.isKidsProfile ? '🧒' : p.name.charAt(0).toUpperCase()}
            </div>
            <div>{p.name}</div>
          </div>
        ))}
        {profiles.length < 5 && !adding && (
          <div className="profile-item profile-add" onClick={() => setAdding(true)}>
            <div className="avatar">+</div>
            <div>Add Profile</div>
          </div>
        )}
        {adding && (
          <div className="profile-item" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={addProfile} style={{ width: 220, textAlign: 'left' }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" required
                style={{ width: '100%', background: '#333', border: 'none', borderRadius: 4, color: '#fff', padding: '10px 12px', marginBottom: 10, outline: 'none' }} />
              <label style={{ fontSize: 13, color: '#b3b3b3', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} /> Kids profile
              </label>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#b3b3b3', marginBottom: 8 }}>Choose avatar</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAvatarUrl(item)}
                      style={{
                        width: 32,
                        height: 32,
                        padding: 0,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: avatarUrl === item ? '2px solid #fff' : '2px solid transparent',
                        background: '#111',
                        cursor: 'pointer',
                        boxShadow: avatarUrl === item ? '0 0 0 2px rgba(255,255,255,0.25)' : 'none',
                      }}
                    >
                      <img
                        src={item}
                        alt="profile avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = AVATAR_OPTIONS[0];
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12, justifyContent: 'center' }}>
                {COLORS.map((c) => (
                  <button type="button" key={c} onClick={() => setColor(c)}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : 'none' }} />
                ))}
              </div>
              <button className="auth-btn" style={{ margin: 0 }}>Create</button>
            </form>
          </div>
        )}
      </div>

      {editProfile && (
        <div className="profile-edit-overlay" onClick={closeEditProfile}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-edit-header">Edit Profile</div>

            <div className="profile-edit-content">
              <div className="profile-edit-avatar-wrap">
                <div className="profile-edit-avatar" style={{ background: editColor }}>
                  {editAvatarUrl ? (
                    <img
                      src={normalizeAvatarUrl(editAvatarUrl)}
                      alt={editName || editProfile.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = AVATAR_OPTIONS[0];
                      }}
                    />
                  ) : (
                    <span>{(editName || editProfile.name || 'P').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {renderAvatarUpload()}
              </div>

              <div className="profile-edit-form">
                <div className="profile-edit-field">
                  <label htmlFor="profile-name">Name</label>
                  <input id="profile-name" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40} />
                </div>

                <div className="profile-edit-field">
                  <label>Language</label>
                  <select defaultValue="English">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                  </select>
                </div>

                <div className="profile-edit-field profile-edit-game">
                  <label>Game Handle</label>
                  <div className="profile-edit-help">
                    Your handle is a unique name that&apos;ll be used for playing with other Netflix members across all Netflix Games.
                    <a href="#">Learn more</a>
                  </div>
                  <button type="button" className="profile-edit-game-btn">Create Game Handle</button>
                </div>

                <div className="profile-edit-avatar-picker">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`avatar-option ${editAvatarUrl === item ? 'selected' : ''}`}
                      onClick={() => {
                        setEditAvatarUrl(item);
                        setAvatarUploadMessage('');
                        setAvatarUploadError('');
                      }}
                    >
                      <img
                        src={item}
                        alt="profile avatar"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = AVATAR_OPTIONS[0];
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="profile-edit-color-row">
                  {COLORS.map((c) => (
                    <button type="button" key={c} className={`color-option ${editColor === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setEditColor(c)} />
                  ))}
                </div>

                <div className="profile-edit-actions">
                  <button type="button" className="btn-gray" onClick={closeEditProfile}>Cancel</button>
                  <button type="button" className="btn-red" onClick={saveProfile} disabled={avatarUploading}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="btn-gray" style={{ marginTop: 50 }} onClick={() => (manage ? nav('/browse') : setManage(true))}>
        {manage ? 'Done' : 'Manage Profiles'}
      </button>
    </div>
  );
}
