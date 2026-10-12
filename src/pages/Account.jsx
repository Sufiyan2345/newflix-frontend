import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { IconAudio, IconBell, IconCaret, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconCreditCardLine, IconDevicesLine, IconDownloadLine, IconFilmLine, IconFlaskLine, IconHomeLine, IconInfo, IconLockLine, IconMailLine, IconPersonAccessLine, IconPhoneLine, IconSettings, IconShieldCheckLine, IconSparklesLine, IconTransferLine, IconTvLine, IconUsers, IconWarningTriangleLine } from '../components/Icons';
import { showActionToast } from '../utils/actionToast';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
  : 'Not available';

const formatAmount = (payment) => payment
  ? `${payment.currency || 'PKR'} ${Number(payment.amount || 0).toLocaleString()}`
  : 'No payment recorded';

function AccountProfileMenu({ nav, closeMenu, logout }) {
  const navigateTo = (path) => {
    closeMenu();
    nav(path);
  };

  return (
    <div className="nx-account-profile-menu" role="menu" aria-label="Profile menu">
      <button type="button" className="nx-account-profile-menu-back" role="menuitem" onClick={() => navigateTo('/browse')}>
        <IconChevronLeft size={19} />
        <span>Back to Netflix</span>
      </button>
      <button type="button" className="nx-account-profile-menu-item" role="menuitem" onClick={() => navigateTo('/account')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1a7 7 0 0 1 14 0v1" /></svg>
        <span>Account</span>
      </button>
      <button type="button" className="nx-account-profile-menu-item" role="menuitem" onClick={() => navigateTo('/account?section=profiles')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Zm11.1-11.1 3.5 3.5" /></svg>
        <span>Manage Profiles</span>
      </button>
      <button type="button" className="nx-account-profile-menu-item" role="menuitem" onClick={() => navigateTo('/p/help-center')}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.6 1.4c-.8 1-2.2 1.2-2.2 2.8M12 16.7h.01" /></svg>
        <span>Help Center</span>
        <svg className="nx-account-profile-external" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h6v6M19 5l-9 9M18 13v5H6V6h5" /></svg>
      </button>
      <div className="nx-account-profile-menu-divider" />
      <button type="button" className="nx-account-profile-menu-item" role="menuitem" onClick={() => navigateTo('/profiles')}>
        <IconUsers size={20} />
        <span>Switch Profile</span>
        <IconChevronRight size={19} className="nx-account-profile-menu-chevron" />
      </button>
      <div className="nx-account-profile-menu-divider" />
      <button type="button" className="nx-account-profile-menu-item nx-account-profile-menu-signout" role="menuitem" onClick={async () => {
        closeMenu();
        await logout();
        nav('/logout');
      }}>
        <span>Sign out</span>
      </button>
    </div>
  );
}

function AccountHeader({ avatar, nav, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="nx-account-header nx-security-header nx-shared-account-header">
      <div className="nx-security-topbar">
        <button type="button" className="nx-security-logo-button" onClick={() => nav('/browse')} aria-label="Newflix home">
          <img src="/newflix.png" alt="Newflix" className="nx-account-logo" />
        </button>
        <div className="nx-account-profile-wrap" ref={menuRef}>
          <button
            type="button"
            className="nx-account-profile"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open profile menu"
          >
            <img src={avatar} alt="Current profile" /><IconCaret size={11} />
          </button>
          {menuOpen && <AccountProfileMenu nav={nav} closeMenu={() => setMenuOpen(false)} logout={logout} />}
        </div>
      </div>
    </header>
  );
}

const DEFAULT_SUBTITLE_APPEARANCE = {
  font: 'casual',
  size: 'medium',
  shadow: 'drop',
  textColor: '#ffffff',
  backgroundColor: '#000000',
  backgroundTransparent: false,
  windowColor: '#000000',
  windowTransparent: true,
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  text: true,
  push: true,
  watch: true,
  recommendations: true,
  surveys: true,
  games: false,
  shop: false,
  usingApp: false,
  membershipOffers: true,
  accountUpdates: true,
};

const readSubtitleAppearance = (profileId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`sf_subtitle_appearance_${profileId}`) || 'null');
    const legacyScale = localStorage.getItem(`sf_subtitle_scale_${profileId}`);
    const legacySize = legacyScale === '75' ? 'small' : legacyScale === '125' ? 'large' : 'medium';
    if (!saved || typeof saved !== 'object') return { ...DEFAULT_SUBTITLE_APPEARANCE, size: legacySize };
    return {
      ...DEFAULT_SUBTITLE_APPEARANCE,
      ...saved,
      size: ['small', 'medium', 'large'].includes(saved.size) ? saved.size : legacySize,
      font: ['casual', 'serif', 'monospace'].includes(saved.font) ? saved.font : 'casual',
      shadow: ['none', 'drop', 'raised', 'uniform'].includes(saved.shadow) ? saved.shadow : 'drop',
      textColor: /^#[\da-f]{6}$/i.test(saved.textColor || '') ? saved.textColor : '#ffffff',
      backgroundColor: /^#[\da-f]{6}$/i.test(saved.backgroundColor || '') ? saved.backgroundColor : '#000000',
      windowColor: /^#[\da-f]{6}$/i.test(saved.windowColor || '') ? saved.windowColor : '#000000',
      backgroundTransparent: Boolean(saved.backgroundTransparent),
      windowTransparent: saved.windowTransparent !== false,
    };
  } catch {
    return { ...DEFAULT_SUBTITLE_APPEARANCE };
  }
};

function AccountRow({ icon, title, description, badge, onClick }) {
  return (
    <button type="button" className="nx-account-row" onClick={onClick}>
      <span className="nx-account-row-icon">{icon}</span>
      <span className="nx-account-row-copy">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      {badge && <span className="nx-account-row-badge">{badge}</span>}
      <IconChevronRight size={18} className="nx-account-chevron" />
    </button>
  );
}

function MembershipView({ user, latestPayment, payments, nav, formatDate, formatAmount }) {
  const nextPayment = latestPayment?.createdAt ? new Date(latestPayment.createdAt) : null;
  if (nextPayment) nextPayment.setMonth(nextPayment.getMonth() + 1);
  const planName = latestPayment?.plan || (user?.signupPlan ? `${user.signupPlan[0].toUpperCase()}${user.signupPlan.slice(1)}` : 'Membership');
  return (
    <>
      <h1 className="nx-account-page-title">Membership</h1>
      <p className="nx-membership-subtitle nx-account-page-subtitle">Plan Details</p>
      <section className="nx-membership-detail-card">
        <div className="nx-membership-detail-top" />
        <div className="nx-membership-detail-body">
          <h2>{planName} plan</h2>
          <p>{latestPayment?.planQuality || '1080p video resolution, ad-free watching and more.'}</p>
        </div>
        <button type="button" className="nx-membership-detail-row" onClick={() => nav('/signup?resume=plan-intro')}><b>Change plan</b><IconChevronRight size={18} /></button>
        <button type="button" className="nx-membership-detail-row nx-extra-member-row" onClick={() => nav('/account?section=extra-member&step=1')}><span><b>Buy an extra member slot</b><small>Share your Netflix with someone who doesn&apos;t live with you.</small></span><em>New</em><IconChevronRight size={18} /></button>
      </section>

      <h2 className="nx-account-section-title nx-membership-section-heading">Payment Info</h2>
      <section className="nx-membership-payment-card">
        <div className="nx-membership-next-payment"><h2>Next payment</h2><p>{nextPayment ? formatDate(nextPayment) : 'Not scheduled'}</p><p><span className="nx-card-mark" /> {latestPayment?.cardLast4 ? `•••• •••• •••• ${latestPayment.cardLast4}` : user?.email}</p></div>
        <button type="button" className="nx-membership-detail-row" onClick={() => document.getElementById('membership-history')?.scrollIntoView({ behavior: 'smooth' })}><b>Manage payment method</b><IconChevronRight size={18} /></button>
        <button type="button" className="nx-membership-detail-row" onClick={() => window.alert('Gift and promo codes will be applied at checkout.')}><b>Redeem gift or promo code</b><IconChevronRight size={18} /></button>
        <button type="button" className="nx-membership-detail-row" onClick={() => document.getElementById('membership-history')?.scrollIntoView({ behavior: 'smooth' })}><b>View payment history</b><IconChevronRight size={18} /></button>
      </section>
      <button type="button" className="nx-cancel-membership" onClick={() => nav('/account?section=manage-membership&panel=cancel')}>Cancel Membership</button>
      <section className="nx-account-card nx-account-payments nx-membership-history" id="membership-history">
        <div className="nx-account-card-heading"><div><h2>Payment history</h2><p>Your masked payment records</p></div><span>{payments.length} record{payments.length === 1 ? '' : 's'}</span></div>
        {payments.length === 0 ? <p className="nx-account-muted">No payments recorded yet.</p> : payments.map((payment) => <div className="nx-payment-row" key={payment._id}><span>{formatDate(payment.createdAt)}</span><b>{formatAmount(payment)}</b><span>{payment.cardBrand || payment.method} {payment.cardLast4 ? `•••• ${payment.cardLast4}` : ''}</span><strong className={payment.status === 'paid' ? 'paid' : ''}>{payment.status}</strong></div>)}
      </section>
    </>
  );
}

function ManageMembershipView({ user, nav, logout }) {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(params.get('panel') || 'cancel');
  const [posters, setPosters] = useState([]);
  const [pauseDone, setPauseDone] = useState(false);

  useEffect(() => {
    API.get('/tmdb/home').then(({ data }) => {
      const items = (data?.rows || []).flatMap((row) => [...(row.items || []), ...(row.top10 || [])]);
      setPosters(items.filter((item) => item.posterUrl || item.bannerUrl).slice(0, 4));
    }).catch(() => {});
  }, []);

  const option = (key, title, closedText, body, action) => (
    <section className={`nx-manage-option${open === key ? ' is-open' : ''}`}>
      <button type="button" className="nx-manage-option-head" onClick={() => setOpen(open === key ? '' : key)}><span><b>{title}</b>{open !== key && <small>{closedText}</small>}</span><span>{open === key ? '−' : '+'}</span></button>
      {open === key && <div className="nx-manage-option-body">{body}<button type="button" className="nx-manage-black-btn" onClick={action}>{key === 'pause' && pauseDone ? 'Paused for 1 Month' : key === 'cancel' ? 'Finish Cancellation' : key === 'pause' ? 'Pause for 1 Month' : 'Change Plan'}</button></div>}
    </section>
  );

  return (
    <div className="nx-manage-membership-page">
      <header className="nx-manage-membership-header"><img src="/newflix.png" alt="Netflix" /><button type="button" onClick={async () => { await logout(); nav('/logout'); }}>Sign Out</button></header>
      <main className="nx-manage-membership-main">
        <button type="button" className="nx-manage-back" onClick={() => nav('/account?section=membership')}><IconChevronLeft size={18} /></button>
        <h1>Manage your membership</h1>
        <p className="nx-manage-intro">Whatever you choose, it&apos;ll take effect on <b>February 22, 2025.</b> You&apos;ll<br />still be able to watch until then.</p>
        <div className="nx-manage-ribbon">Member since {user?.createdAt ? formatDate(user.createdAt).replace(/^\d+\s+\w+\s+/, '') : 'November 2024'}</div>
        {option('cancel', 'Cancel', 'Lose personalized recommendations', <><p>Canceling your membership means losing access to personalized recommendations. We&apos;ll miss you, but you can come back and restart anytime.</p><label><input type="checkbox" /> Yes, please email me about newly added TV shows &amp; movies and Netflix special offers.</label></>, () => nav('/logout'))}
        {option('pause', 'Pause for a month', 'Keep your profiles and preferences', <p>Pause lets you keep your profiles and preferences. You can still browse and unpause anytime.</p>, () => setPauseDone(true))}
        {option('plan', 'Change Plan', 'Try a plan that\'s a better fit', <p>Choose a plan that works better for your household.</p>, () => nav('/signup?resume=plan-intro'))}
        <section className="nx-manage-watch"><h2>What to watch before you leave</h2><button type="button" className="nx-manage-return" onClick={() => nav('/browse')}>Return to Watching</button><div className="nx-manage-posters">{posters.map((poster) => <img key={poster._id || poster.id || poster.title} src={poster.posterUrl || poster.bannerUrl} alt={poster.title || ''} />)}</div></section>
      </main>
    </div>
  );
}

function ExtraMemberView({ step, user, nav, logout }) {
  const [form, setForm] = useState({ name: '', email: '', from: user?.name || '' });
  const isForm = step === '2';
  const goNext = (event) => { event.preventDefault(); nav('/account?section=extra-member&step=2'); };
  return (
    <div className="nx-extra-member-page">
      <header className="nx-extra-member-header"><img src="/newflix.png" alt="Netflix" /><button type="button" onClick={async () => { await logout(); nav('/logout'); }}>Sign Out</button></header>
      <main className={`nx-extra-member-main${isForm ? ' is-form' : ''}`}>
        {!isForm ? (
          <>
            <div className="nx-extra-member-icon" aria-hidden="true"><svg viewBox="0 0 80 80" fill="none"><defs><linearGradient id="extraGlow" x1="18" y1="63" x2="64" y2="16" gradientUnits="userSpaceOnUse"><stop stopColor="#e50914" /><stop offset=".52" stopColor="#b53bbd" /><stop offset="1" stopColor="#ffb126" /></linearGradient></defs><path d="M20 65c0-20 7-33 24-43-5 10-5 18 1 25-1-15 7-28 18-34-3 13-1 22 7 30-3 14-13 23-29 23H20Z" fill="url(#extraGlow)" /><path d="m57 7 3.7 9.2 9.8.7-7.5 6.3 2.4 9.5-8.4-5.1-8 5.1 2.2-9.5-7.3-6.3 9.7-.7L57 7Z" fill="#f59b29" /></svg></div>
            <h1>Extra member added!</h1>
            <h2>Now tell us:</h2>
            <button type="button" className="nx-extra-choice" onClick={() => nav('/account?section=extra-member&step=2')}><span className="nx-extra-choice-icon">♙<b>+</b></span>Who do you want to invite?</button>
            <button type="button" className="nx-extra-choice" onClick={() => nav('/account?section=extra-member&step=2')}><span className="nx-extra-choice-icon">♙<b>→</b></span>Will they use a new or an existing<br />profile?</button>
            <p className="nx-extra-note">Your new payment will be due every month on the 17th. We emailed the details to <b>{user?.email || 'your email address'}.</b></p>
            <button type="button" className="nx-extra-next" onClick={() => nav('/account?section=extra-member&step=2')}>Next</button>
          </>
        ) : (
          <form onSubmit={goNext}>
            <h1>Who will your extra member<br />be?</h1>
            <p className="nx-extra-intro">We&apos;ll email them an invitation with detailed setup instructions.</p>
            <label>To:</label>
            <input placeholder="Their name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div className="nx-extra-email-field"><input type="email" placeholder="Their email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><span>•••</span></div>
            <label>From:</label>
            <input placeholder="Your name" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
            <p className="nx-extra-copy">The person you invite will receive an email with the name you enter here. Make sure you have permission from the person you&apos;re inviting to provide their information.</p>
            <p className="nx-extra-copy">As long as they&apos;re an extra member that you pay for, they&apos;ll be able to see the email address associated with your Netflix account.</p>
            <button type="submit" className="nx-extra-next">Next</button>
          </form>
        )}
      </main>
      <footer className="nx-extra-footer"><p>Questions? Call <a href="tel:18445052993">1-844-505-2993</a></p><div><a href="/p/faq">FAQ</a><a href="/p/help-center">Help Center</a><a href="/p/terms">Terms of Use</a><a href="/p/privacy">Privacy</a></div></footer>
    </div>
  );
}

function SecurityRow({ icon, title, detail, status, badge, onClick }) {
  return (
    <button type="button" className={`nx-security-row${detail || status ? ' has-detail' : ''}`} onClick={onClick}>
      <span className="nx-security-row-icon">{icon}</span>
      <span className="nx-security-row-copy">
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
        {status && <small className={`nx-security-row-status${status === 'Verified' ? ' is-verified' : ''}`}>{status}</small>}
      </span>
      {badge && <span className="nx-security-row-badge">{badge}</span>}
      <IconChevronRight size={15} className="nx-security-row-chevron" />
    </button>
  );
}

function SecurityView({ user, avatar, nav, logout }) {
  const [featureTesting, setFeatureTesting] = useState(true);
  const phoneVerified = Boolean(user?.isPhoneVerified || user?.phoneVerified);
  const emailVerified = Boolean(user?.isEmailVerified);

  return (
    <div className="nx-account-page nx-security-page">
      <AccountHeader avatar={avatar} nav={nav} logout={logout} />

      <div className="nx-security-shell">
        <aside className="nx-account-sidebar nx-security-sidebar" aria-label="Account sections">
          <button className="nx-security-back" type="button" onClick={() => nav('/browse')}><IconChevronLeft size={14} /> Back to Netflix</button>
          <button type="button" onClick={() => nav('/account')}><IconHomeLine size={16} /> Overview</button>
          <button type="button" onClick={() => nav('/account?section=membership')}><IconCreditCardLine size={16} /> Membership</button>
          <button className="is-current" type="button" aria-current="page"><IconShieldCheckLine size={16} /> Security</button>
          <button type="button" onClick={() => nav('/account?section=devices')}><IconDevicesLine size={16} /> Devices</button>
          <button type="button" onClick={() => nav('/account?section=profiles')}><IconUsers size={16} /> Profiles</button>
        </aside>

        <main className="nx-security-content">
          {!phoneVerified && (
            <div className="nx-security-warning" role="note">
              <IconWarningTriangleLine size={16} />
              <span><strong>Verify your mobile number</strong><small>Verifying your phone number enhances security and can help you access and recover your account. <button type="button" onClick={() => document.getElementById('security-phone')?.focus()}>Verify now.</button></small></span>
            </div>
          )}

          <h1>Security</h1>
          <p className="nx-security-subtitle">Account Details</p>
          <section className="nx-security-card" aria-label="Account details">
            <SecurityRow icon={<IconLockLine size={16} />} title="Password" onClick={() => nav('/account?section=change-password')} />
            <SecurityRow icon={<IconMailLine size={16} />} title="Email" detail={user?.email || 'Email address not available'} status={emailVerified ? 'Verified' : 'Needs verification'} onClick={() => {}} />
            <SecurityRow icon={<IconPhoneLine size={16} />} title="Mobile phone" detail={user?.phone || undefined} status={phoneVerified ? 'Verified' : 'Needs verification'} onClick={() => {}} />
          </section>

          <h2 className="nx-security-section-title">Access and privacy</h2>
          <section className="nx-security-card nx-security-access-card" aria-label="Access and privacy">
            <SecurityRow icon={<IconDevicesLine size={17} />} title="Access and devices" detail="Manage signed-in devices" onClick={() => nav('/account?section=devices')} />
            <SecurityRow icon={<IconTransferLine size={17} />} title="Profile transfer" detail="On" badge="New" onClick={() => nav('/profiles')} />
            <SecurityRow icon={<IconPersonAccessLine size={17} />} title="Personal information access" detail="Request a copy of your personal information" onClick={() => nav('/p/privacy')} />
            <SecurityRow icon={<IconFlaskLine size={17} />} title="Feature testing" detail={featureTesting ? 'On' : 'Off'} onClick={() => setFeatureTesting((enabled) => !enabled)} />
          </section>

          <button type="button" className="nx-security-delete" onClick={() => nav('/p/privacy')}>Delete Account</button>
        </main>
      </div>
    </div>
  );
}

function ChangePasswordView({ user, avatar, nav, logout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signOutAllDevices, setSignOutAllDevices] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8 || newPassword.length > 60) {
      setError('Your new password must be between 8 and 60 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await API.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
        signOutAllDevices,
      });
      if (data.signedOut) {
        await logout();
        nav('/login', { replace: true, state: { message: 'Password updated. Sign in with your new password.' } });
        return;
      }
      if (data.accessToken) localStorage.setItem('sf_token', data.accessToken);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(data.message || 'Your password has been updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const passwordField = (label, value, setValue, autoComplete, options = {}) => (
    <label className="nx-change-password-field">
      <input
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={label}
        autoComplete={autoComplete}
        minLength={options.minLength}
        maxLength={options.maxLength}
        required
      />
      {options.forgot && <a className="nx-change-password-forgot" href="/login/help">Forgot Password?</a>}
    </label>
  );

  return (
    <div className="nx-account-page nx-security-page nx-profile-detail-page nx-change-password-page">
      <AccountHeader avatar={avatar} nav={nav} logout={logout} />
      <main className="nx-change-password-main">
        <button type="button" className="nx-profile-settings-back" onClick={() => nav('/account?section=security')} aria-label="Back to Security"><IconChevronLeft size={21} /></button>
        <section className="nx-change-password-content">
          {user?.passwordless ? (
            <>
              <h1>Set a password</h1>
              <p className="nx-change-password-subtitle">This account currently uses passwordless sign-in. Create a password to sign in with your email and password.</p>
              <a className="nx-change-password-reset-link" href="/login/help">Create or reset password</a>
            </>
          ) : success ? (
            <div className="nx-change-password-success" role="status">
              <h1>Password updated</h1>
              <p>{success}</p>
              <button type="button" onClick={() => nav('/account?section=security')}>Back to Security</button>
            </div>
          ) : (
            <>
              <h1>Change password</h1>
              <p className="nx-change-password-subtitle">Protect your account with a unique password at least 8 characters long.</p>
              <form onSubmit={submit}>
                {passwordField('Current Password', currentPassword, setCurrentPassword, 'current-password', { forgot: true })}
                {passwordField('New password (8-60 characters)', newPassword, setNewPassword, 'new-password', { minLength: 8, maxLength: 60 })}
                {passwordField('Re-enter new password', confirmPassword, setConfirmPassword, 'new-password', { minLength: 8, maxLength: 60 })}
                <label className="nx-change-password-signout">
                  <input type="checkbox" checked={signOutAllDevices} onChange={(event) => setSignOutAllDevices(event.target.checked)} />
                  <span>Sign out all devices</span>
                </label>
                {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
                <div className="nx-change-password-save-wrap"><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
                <button type="button" className="nx-change-password-cancel" onClick={() => nav('/account?section=security')} disabled={busy}>Cancel</button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function DevicesView({ user, avatar, profileName, nav, logout }) {
  const downloadLimit = ({ mobile: 1, basic: 1, standard: 2, premium: 6 })[user?.signupPlan] || 1;
  const [accessOpen, setAccessOpen] = useState(false);
  const selectedDevices = Array.isArray(user?.onboarding?.devices) ? user.onboarding.devices : [];
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const browserName = /Edg\//.test(userAgent)
    ? 'Microsoft Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Web Browser';
  const platformName = /Windows/i.test(userAgent)
    ? 'PC'
    : /Macintosh|Mac OS/i.test(userAgent)
      ? 'Mac'
      : /Android/i.test(userAgent)
        ? 'Android Phone'
        : /iPhone|iPad/i.test(userAgent)
          ? 'iPhone or iPad'
          : 'Computer';
  const isMobileBrowser = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  const currentDeviceName = `${platformName} ${browserName} - ${isMobileBrowser ? 'Mobile' : 'Web'} Browser`;
  const lastActive = user?.lastLoginAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(user.lastLoginAt))
    : 'Active on this browser';

  const deviceIcon = (device) => {
    if (device === 'TV') return <IconTvLine size={20} />;
    if (device === 'Phone or Tablet') return <IconPhoneLine size={19} />;
    if (device === 'Computer') return <IconDevicesLine size={20} />;
    if (device === 'Game Console') return <img src="/game.png" alt="" />;
    if (device === 'Streaming Device') return <img src="/usb.png" alt="" />;
    return <IconDevicesLine size={20} />;
  };

  return (
    <div className="nx-account-page nx-security-page nx-devices-page">
          <AccountHeader avatar={avatar} nav={nav} logout={logout} />

          <div className="nx-security-shell nx-devices-shell">
            <aside className="nx-account-sidebar nx-security-sidebar" aria-label="Account sections">
              <button className="nx-security-back" type="button" onClick={() => nav('/browse')}><IconChevronLeft size={16} /> Back to Newflix</button>
              <button type="button" onClick={() => nav('/account')}><IconHomeLine size={19} /> Overview</button>
              <button type="button" onClick={() => nav('/account?section=membership')}><IconCreditCardLine size={19} /> Membership</button>
              <button type="button" onClick={() => nav('/account?section=security')}><IconShieldCheckLine size={19} /> Security</button>
              <button className="is-current" type="button" aria-current="page"><IconDevicesLine size={19} /> Devices</button>
              <button type="button" onClick={() => nav('/account?section=profiles')}><IconUsers size={19} /> Profiles</button>
            </aside>

            <main className="nx-security-content nx-devices-content">
              {!accessOpen ? (
                <>
              <h1>Devices</h1>
              <p className="nx-security-subtitle">Account Access</p>
              <button type="button" className="nx-devices-card nx-devices-entry" onClick={() => setAccessOpen(true)}>
                <span className="nx-devices-card-icon"><IconDevicesLine size={23} /></span>
                <span className="nx-devices-card-copy"><strong>Access and devices</strong><small>Manage signed-in devices</small></span>
                <IconChevronRight size={19} className="nx-devices-chevron" />
              </button>

              <h2 className="nx-devices-section-title">Mobile Downloads</h2>
              <section className="nx-devices-card" aria-label="Mobile download devices">
                <div className="nx-devices-card-icon"><IconDownloadLine size={23} /></div>
                <div className="nx-devices-card-copy"><strong>Mobile download devices</strong><small>Using 0 of {downloadLimit} download device{downloadLimit === 1 ? '' : 's'}</small></div>
                <IconChevronRight size={19} className="nx-devices-chevron" />
              </section>
                </>
              ) : (
                <section className="nx-access-devices-page" aria-labelledby="nx-access-devices-title">
                  <button type="button" className="nx-access-back" onClick={() => setAccessOpen(false)}><IconChevronLeft size={16} /> Back to Devices</button>
                  <div className="nx-access-devices-inner">
                    <div className="nx-access-hero">
                      <img className="nx-access-manage-icon" src="/manage.png" alt="" />
                      <h1 id="nx-access-devices-title">Manage access and devices</h1>
                      <p>Review recent activity for this account and the devices selected during setup. For added security, you can <button type="button" onClick={() => nav('/account?section=change-password')}>change your password</button>.</p>
                    </div>

                    <div className="nx-access-device-list">
                      <section className="nx-access-device">
                        <div className="nx-access-device-head">
                          <span className="nx-access-device-symbol"><IconDevicesLine size={21} /></span>
                          <span className="nx-access-device-copy">
                            <span className="nx-access-device-title">{currentDeviceName}</span>
                          </span>
                          <button
                            type="button"
                            className="nx-access-device-signout"
                            onClick={async () => { await logout(); nav('/logout'); }}
                          >
                            Sign Out
                          </button>
                        </div>
                        <div className="nx-access-device-details">
                          <div className="nx-access-device-detail-row nx-access-device-profile-row">
                            <img src={avatar} alt="" />
                            <span>{profileName || 'Profile'} <small>Current profile</small></span>
                          </div>
                          <div className="nx-access-device-detail-row"><IconClock size={15} /><span>{lastActive}</span></div>
                        </div>
                      </section>

                      {Array.from(new Set(selectedDevices)).map((device) => (
                        <section className="nx-access-device is-selected-device" key={device}>
                          <div className="nx-access-device-head">
                            <span className="nx-access-device-symbol">{deviceIcon(device)}</span>
                            <span className="nx-access-device-copy">
                              <span className="nx-access-device-title">{device === 'Phone or Tablet' ? 'Phone or Tablet' : device}</span>
                            </span>
                            <span className="nx-access-current-badge is-selected">SELECTED DEVICE</span>
                          </div>
                          <div className="nx-access-device-details">
                            <div className="nx-access-device-detail-row nx-access-device-profile-row">
                              <img src={avatar} alt="" />
                              <span>{profileName || 'Profile'} <small>Selected during account setup</small></span>
                            </div>
                            <div className="nx-access-device-detail-row"><IconInfo size={15} /><span>Not an active sign-in</span></div>
                          </div>
                        </section>
                      ))}
                    </div>

                    <p className="nx-access-note">This list may not be complete. Some device activity may not be shown. <a href="/p/help-center">Learn More</a></p>
                  </div>
                </section>
              )}
            </main>
          </div>

          <footer className="nx-devices-footer">
            <p>Questions? <a href="/p/contact">Contact Us</a></p>
            <nav aria-label="Footer links">
              <a href="/p/investor-relations">Investor Relations</a>
              <a href="/p/terms">Terms of Use</a>
              <a href="/p/gift-cards">Gift Cards</a>
              <a href="/p/media-center">Media Center</a>
              <a href="/p/privacy">Privacy Statement</a>
              <a href="/p/audio-subtitles">Audio and Subtitles</a>
              <a href="/p/jobs">Jobs</a>
              <a href="/p/help-center">Help Center</a>
              <a href="/p/cookie-preferences">Cookie Preferences</a>
            </nav>
          </footer>
    </div>
  );
}

const PROFILE_MATURITY_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: '7+', label: '7+' },
  { value: '10+', label: '10+' },
  { value: '13+', label: '13+' },
  { value: '16+', label: '16+' },
  { value: '18+', label: '18+' },
];

const PROFILE_LANGUAGES = [
  { value: 'da', label: 'Dansk' },
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'es', label: 'Español' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'fil', label: 'Filipino' },
  { value: 'fi', label: 'Suomi' },
  { value: 'fr', label: 'Français' },
  { value: 'he', label: 'עברית' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'no', label: 'Norsk' },
  { value: 'pl', label: 'Polski' },
  { value: 'pt', label: 'Português' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'ro', label: 'Română' },
  { value: 'ru', label: 'Русский' },
  { value: 'sv', label: 'Svenska' },
  { value: 'th', label: 'ไทย' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'uk', label: 'Українська' },
  { value: 'ur', label: 'اردو' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'zh', label: '中文' },
];
const normalizeProfileLanguage = (value) => {
  const normalized = String(value || '').toLocaleLowerCase();
  const legacyLanguage = PROFILE_LANGUAGES.find((item) => item.label.toLocaleLowerCase() === normalized);
  return PROFILE_LANGUAGES.some((item) => item.value.toLocaleLowerCase() === normalized)
    ? PROFILE_LANGUAGES.find((item) => item.value.toLocaleLowerCase() === normalized).value
    : legacyLanguage?.value || 'en';
};

function ProfileAccountShell({ avatar, nav, section, children }) {
  const { logout } = useAuth();
  return (
    <div className="nx-account-page nx-security-page nx-devices-page nx-profiles-account-page">
      <AccountHeader avatar={avatar} nav={nav} logout={logout} />
      <div className="nx-security-shell nx-devices-shell nx-profiles-shell">
        <aside className="nx-account-sidebar nx-security-sidebar" aria-label="Account sections">
          <button className="nx-security-back" type="button" onClick={() => nav('/browse')}><IconChevronLeft size={16} /> Back to Netflix</button>
          <button type="button" onClick={() => nav('/account')}><IconHomeLine size={19} /> Overview</button>
          <button type="button" onClick={() => nav('/account?section=membership')}><IconCreditCardLine size={19} /> Membership</button>
          <button type="button" onClick={() => nav('/account?section=security')}><IconShieldCheckLine size={19} /> Security</button>
          <button type="button" onClick={() => nav('/account?section=devices')}><IconDevicesLine size={19} /> Devices</button>
          <button className={section === 'profiles' || section === 'profile-settings' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=profiles')}><IconUsers size={19} /> Profiles</button>
        </aside>
        <main className="nx-security-content nx-devices-content nx-profiles-content">{children}</main>
      </div>
    </div>
  );
}

function ProfileSettingsRow({ icon, title, detail, onClick }) {
  return (
    <button type="button" className="nx-profile-pref-row" onClick={onClick}>
      <span className="nx-profile-pref-icon">{icon}</span>
      <span className="nx-profile-pref-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
      <IconChevronRight size={18} />
    </button>
  );
}

function ProfileCodeFields({ count, value, onChange, label }) {
  const refs = useRef([]);
  const digits = Array.from({ length: count }, (_, index) => value[index] || '');
  const update = (index, raw) => {
    const entered = raw.replace(/\D/g, '');
    const next = [...digits];
    if (entered.length > 1) {
      entered.slice(0, count - index).split('').forEach((digit, offset) => { next[index + offset] = digit; });
    } else {
      next[index] = entered.slice(-1);
    }
    onChange(next.join(''));
    const nextIndex = entered.length > 1
      ? Math.min(count - 1, index + entered.length - 1)
      : entered ? Math.min(count - 1, index + 1) : index;
    refs.current[nextIndex]?.focus();
  };
  return (
    <div className="nx-profile-code-fields" role="group" aria-label={label}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { refs.current[index] = element; }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={index === 0}
          aria-label={`${label}, digit ${index + 1} of ${count}`}
          value={digit}
          maxLength={count}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus();
            if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
            if (event.key === 'ArrowRight' && index < count - 1) refs.current[index + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

function AccountProfilesView({ profiles, activeProfile, avatar, nav, loadMe, selectProfile, profileId, initialDialog }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKidsProfile, setNewKidsProfile] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = profiles.find((profile) => profile._id === profileId);
  const goBack = () => nav('/account?section=profiles');

  const closeAddProfile = () => {
    if (busy) return;
    setAdding(false);
    setNewName('');
    setNewKidsProfile(false);
    setError('');
  };

  const createProfile = async (event) => {
    event.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) {
      setError('Profile name is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await API.post('/user/profiles', {
        name: cleanName,
        isKidsProfile: newKidsProfile,
        avatarUrl: '/Netflix-avatar-1.png',
      });
      await loadMe();
      setNewName('');
      setNewKidsProfile(false);
      setAdding(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add this profile. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (profileId && selected) {
    return <ProfilePreferencesView profile={selected} activeProfile={activeProfile} avatar={avatar} nav={nav} loadMe={loadMe} selectProfile={selectProfile} goBack={goBack} initialDialog={initialDialog} />;
  }

  return (
    <ProfileAccountShell avatar={avatar} nav={nav} section="profiles">
      <h1 className="nx-profiles-heading">Profiles</h1>
      <p className="nx-profiles-subtitle">Parental Controls and Permissions</p>
      <section className="nx-security-card nx-profiles-permissions" aria-label="Parental controls and profile transfer">
        <ProfileSettingsRow icon={<IconShieldCheckLine size={20} />} title="Adjust parental controls" detail="Set age ratings, block titles" onClick={() => { if (profiles.length) nav(`/account?section=profile-settings&profileId=${profiles[0]._id}&dialog=parental`); }} />
        <ProfileSettingsRow icon={<IconTransferLine size={20} />} title="Transfer a profile" detail="Copy a profile to another account" onClick={() => nav('/profiles?settings=1')} />
      </section>

      <h2 className="nx-profiles-list-title">Profile Settings</h2>
      <section className="nx-security-card nx-profiles-list" aria-label="Profiles">
        {profiles.map((profile) => (
          <div className="nx-profiles-list-row" key={profile._id}>
            <button type="button" className="nx-profiles-list-main" onClick={() => nav(`/account?section=profile-settings&profileId=${profile._id}`)}>
              <span className="nx-profiles-avatar" style={{ backgroundColor: profile.avatarColor || '#e50914' }}>
                <img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />
              </span>
              <strong>{profile.name}</strong>
              {profile.isKidsProfile && <small className="nx-profiles-kids-label">Kids profile</small>}
            </button>
            {profile._id === activeProfile?._id && (
              <button type="button" className="nx-profiles-view-profile" onClick={() => { selectProfile(profile); nav('/browse'); }}>
                View profile
              </button>
            )}
            <button type="button" className="nx-profiles-row-open" aria-label={`Manage ${profile.name}`} onClick={() => nav(`/account?section=profile-settings&profileId=${profile._id}`)}>
              <IconChevronRight size={18} />
            </button>
          </div>
        ))}
        {profiles.length < 5 && !adding && <button type="button" className="nx-profiles-add" onClick={() => { setError(''); setAdding(true); }}>Add Profile</button>}
      </section>
      <p className="nx-profiles-list-note">Add up to 5 profiles for anyone who lives with you.</p>
      {adding && (
        <div
          className="nx-add-profile-backdrop"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeAddProfile(); }}
        >
          <form
            className="nx-add-profile-dialog"
            onSubmit={createProfile}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nx-add-profile-title"
            aria-describedby="nx-add-profile-description"
          >
            <h2 id="nx-add-profile-title">Add a profile</h2>
            <p id="nx-add-profile-description">Add a profile for another person watching Netflix.</p>
            <div className="nx-add-profile-identity">
              <img src="/Netflix-avatar-1.png" alt="" />
              <label className="nx-add-profile-name">
                <span className="nx-visually-hidden">Profile name</span>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Name"
                  required
                  maxLength={40}
                  autoFocus
                  disabled={busy}
                />
              </label>
            </div>
            <label className="nx-add-profile-kids">
              <span>
                <strong>Children&apos;s profile</strong>
                <small>Only see child-friendly TV programmes and films</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                aria-label="Children's profile"
                checked={newKidsProfile}
                onChange={(event) => setNewKidsProfile(event.target.checked)}
                disabled={busy}
              />
            </label>
            {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
            <div className="nx-add-profile-actions">
              <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={closeAddProfile} disabled={busy}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </ProfileAccountShell>
  );
}

function ProfilePreferencesView({ profile, activeProfile, avatar, nav, loadMe, selectProfile, goBack, initialDialog }) {
  const { user, logout } = useAuth();
  const [dialog, setDialog] = useState(initialDialog === 'parental' ? 'parental-confirm' : initialDialog || null);
  const [name, setName] = useState(profile.name);
  const [profileAvatar, setProfileAvatar] = useState(profile.avatarUrl || '/Netflix-avatar-1.png');
  const [profileEmail, setProfileEmail] = useState(profile.profileEmail || '');
  const [profileEmailInput, setProfileEmailInput] = useState(profile.profileEmail || '');
  const [profileEmailMarketingOptOut, setProfileEmailMarketingOptOut] = useState(Boolean(profile.profileEmailMarketingOptOut));
  const [profileEmailCode, setProfileEmailCode] = useState('');
  const [profileEmailStep, setProfileEmailStep] = useState('edit');
  const [profileEmailNotice, setProfileEmailNotice] = useState('');
  const [language, setLanguage] = useState(() => normalizeProfileLanguage(profile.language));
  const [preferredAudioLanguages, setPreferredAudioLanguages] = useState(profile.preferredAudioLanguages || ['en']);
  const [displayLanguageOpen, setDisplayLanguageOpen] = useState(false);
  const displayLanguageRef = useRef(null);
  const [maturity, setMaturity] = useState(profile.maturityLimit || '18+');
  const [kidsProfile, setKidsProfile] = useState(Boolean(profile.isKidsProfile));
  const [restrictedTitles, setRestrictedTitles] = useState(profile.restrictedTitles || []);
  const [restrictedTitleQuery, setRestrictedTitleQuery] = useState('');
  const [titleSearchResults, setTitleSearchResults] = useState([]);
  const [titleSearchError, setTitleSearchError] = useState('');
  const [autoplayNext, setAutoplayNext] = useState(profile.autoplayNext !== false);
  const [autoplayPreviews, setAutoplayPreviews] = useState(profile.autoplayPreviews !== false);
  const [dataUsage, setDataUsage] = useState(profile.dataUsage || 'high');
  const [notificationPreferences, setNotificationPreferences] = useState(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...profile.notificationPreferences,
  }));
  const [dataSharingOptOut, setDataSharingOptOut] = useState(Boolean(profile.dataSharingOptOut));
  const [subtitleScale, setSubtitleScale] = useState(() => localStorage.getItem(`sf_subtitle_scale_${profile._id}`) || '100');
  const [subtitleAppearance, setSubtitleAppearance] = useState(() => readSubtitleAppearance(profile._id));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const avatarInputRef = useRef(null);
  const [lockStep, setLockStep] = useState(initialDialog === 'parental' ? 'confirm' : 'overview');
  const [lockAction, setLockAction] = useState(initialDialog === 'parental' ? 'parental' : 'set');
  const [lockDelivery, setLockDelivery] = useState('email');
  const [lockPassword, setLockPassword] = useState('');
  const [lockPasswordVisible, setLockPasswordVisible] = useState(false);
  const [lockCode, setLockCode] = useState('');
  const [lockPin, setLockPin] = useState('');
  const [lockTicket, setLockTicket] = useState('');
  const [lockError, setLockError] = useState('');
  const [lockNotice, setLockNotice] = useState('');
  const isYourProfile = profile._id === activeProfile?._id;
  const maskedEmail = user?.email?.replace(/^(.)([^@]*)(@.*)$/, (_match, first, rest, domain) => `${first}${'•'.repeat(Math.max(3, rest.length))}${domain}`) || 'your verified account email';

  useEffect(() => {
    if (dialog !== 'language' || !displayLanguageOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!displayLanguageRef.current?.contains(event.target)) setDisplayLanguageOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDisplayLanguageOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [dialog, displayLanguageOpen]);

  useEffect(() => {
    const query = restrictedTitleQuery.trim();
    if (dialog !== 'parental' || query.length < 2) {
      setTitleSearchResults([]);
      setTitleSearchError('');
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data } = await API.get('/tmdb/search', { params: { q: query }, softFail: true });
        if (!cancelled) {
          setTitleSearchResults((data.items || []).slice(0, 6));
          setTitleSearchError('');
        }
      } catch {
        if (!cancelled) setTitleSearchError('Title search is temporarily unavailable. You can still add the title by pressing Enter.');
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dialog, restrictedTitleQuery]);

  const beginLockAction = (action) => {
    setLockAction(action);
    setLockStep('confirm');
    setLockPassword('');
    setLockPasswordVisible(false);
    setLockCode('');
    setLockPin('');
    setLockTicket('');
    setLockError('');
    setLockNotice('');
  };

  const currentLockAction = (actionOverride) => {
    if (actionOverride) return actionOverride;
    if (dialog === 'parental-confirm' || dialog === 'parental') return 'parental';
    return lockAction;
  };

  const requestLockCode = async (delivery, actionOverride) => {
    const action = currentLockAction(actionOverride);
    setBusy(true);
    setLockError('');
    setLockNotice('');
    try {
      const { data } = await API.post(`/user/profiles/${profile._id}/lock/send-${delivery}`, { action });
      setLockDelivery(delivery);
      setLockNotice(data.message || `Verification code sent to ${delivery === 'sms' ? 'your mobile phone' : maskedEmail}.`);
      setLockCode('');
      setLockStep('otp');
    } catch (err) {
      setLockError(err.response?.data?.message || `Could not send the ${delivery === 'sms' ? 'text' : 'email'} verification code. Please try again.`);
    } finally {
      setBusy(false);
    }
  };
  const requestLockEmailCode = (actionOverride) => requestLockCode('email', actionOverride);
  const requestLockSMSCode = (actionOverride) => requestLockCode('sms', actionOverride);

  const beginParentalConfirmation = () => {
    beginLockAction('parental');
    setError('');
    setDialog('parental-confirm');
  };

  const finishProfileLockDelete = async (ticket) => {
    setBusy(true);
    setLockError('');
    try {
      await API.post(`/user/profiles/${profile._id}/lock/delete`, { ticket });
      sessionStorage.removeItem(`sf_profile_unlock_${profile._id}`);
      if (isYourProfile) selectProfile(null);
      await loadMe();
      setLockNotice('Profile Lock has been removed.');
      setLockStep('overview');
    } catch (err) {
      setLockError(err.response?.data?.message || 'Could not remove the profile lock.');
    } finally {
      setBusy(false);
    }
  };

  const verifyLockEmailCode = async (event, actionOverride) => {
    event.preventDefault();
    const action = currentLockAction(actionOverride);
    setBusy(true);
    setLockError('');
    try {
      const { data } = await API.post(`/user/profiles/${profile._id}/lock/verify-email`, {
        action,
        delivery: lockDelivery,
        otp: lockCode,
      });
      setLockTicket(data.ticket);
      if (action === 'parental') {
        setDialog('parental');
        setError('');
      } else if (action === 'delete') await finishProfileLockDelete(data.ticket);
      else {
        setLockPin('');
        setLockStep('pin');
      }
    } catch (err) {
      setLockError(err.response?.data?.message || 'Could not verify the email code.');
    } finally {
      setBusy(false);
    }
  };

  const confirmLockPassword = async (event, actionOverride) => {
    event.preventDefault();
    const action = currentLockAction(actionOverride);
    setBusy(true);
    setLockError('');
    try {
      const { data } = await API.post(`/user/profiles/${profile._id}/lock/confirm-password`, { action, password: lockPassword });
      setLockTicket(data.ticket);
      setLockPassword('');
      if (action === 'parental') {
        setDialog('parental');
        setError('');
      } else if (action === 'delete') await finishProfileLockDelete(data.ticket);
      else {
        setLockPin('');
        setLockStep('pin');
      }
    } catch (err) {
      setLockError(err.response?.data?.message || 'Could not confirm the account password.');
    } finally {
      setBusy(false);
    }
  };

  const saveProfileLockPIN = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLockError('');
    try {
      await API.post(`/user/profiles/${profile._id}/lock/pin`, { ticket: lockTicket, pin: lockPin });
      sessionStorage.removeItem(`sf_profile_unlock_${profile._id}`);
      if (isYourProfile) selectProfile(null);
      await loadMe();
      setLockNotice(lockAction === 'set' && profile.profileLockEnabled ? 'Your profile PIN has been updated.' : 'Profile Lock is on.');
      setLockStep('overview');
    } catch (err) {
      setLockError(err.response?.data?.message || 'Could not save the profile PIN.');
    } finally {
      setBusy(false);
    }
  };

  const closeLockPage = () => {
    setLockError('');
    setLockNotice('');
    setDialog(null);
  };

  const openDialog = (key) => {
    if (key === 'parental') {
      beginParentalConfirmation();
      return;
    }
    setError('');
    setName(profile.name);
    setProfileAvatar(profile.avatarUrl || '/Netflix-avatar-1.png');
    setProfileEmailInput(profile.profileEmail || '');
    setProfileEmailMarketingOptOut(Boolean(profile.profileEmailMarketingOptOut));
    setProfileEmailCode('');
    setProfileEmailStep('edit');
    setProfileEmailNotice('');
    setLanguage(normalizeProfileLanguage(profile.language));
    setPreferredAudioLanguages(profile.preferredAudioLanguages || ['en']);
    setDisplayLanguageOpen(false);
    setMaturity(profile.maturityLimit || '18+');
    setKidsProfile(Boolean(profile.isKidsProfile));
    setRestrictedTitles(profile.restrictedTitles || []);
    setRestrictedTitleQuery('');
    setTitleSearchResults([]);
    setTitleSearchError('');
    setAutoplayNext(profile.autoplayNext !== false);
    setAutoplayPreviews(profile.autoplayPreviews !== false);
    setDataUsage(profile.dataUsage || 'high');
    setNotificationPreferences({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...profile.notificationPreferences,
    });
    setDataSharingOptOut(Boolean(profile.dataSharingOptOut));
    setDialog(key);
  };

  const uploadProfileAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Choose a PNG, JPG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    setAvatarUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await API.post('/upload/profile-image', formData);
      setProfileAvatar(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload this image. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const sendProfileEmailCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setProfileEmailNotice('');
    try {
      const { data } = await API.post(`/user/profiles/${profile._id}/email/send-otp`, { email: profileEmailInput.trim() });
      setProfileEmailInput(data.email || profileEmailInput.trim());
      setProfileEmailCode('');
      setProfileEmailStep('verify');
      setProfileEmailNotice(data.message || 'Verification code sent. It expires in 10 minutes.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the verification code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyProfileEmailCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.post(`/user/profiles/${profile._id}/email/verify-otp`, {
        email: profileEmailInput.trim(),
        otp: profileEmailCode,
        marketingOptOut: profileEmailMarketingOptOut,
      });
      setProfileEmail(profileEmailInput.trim().toLowerCase());
      await loadMe();
      setDialog('personal');
      setProfileEmailStep('edit');
      setProfileEmailCode('');
      setProfileEmailNotice('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify the email address. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const openProfileEmail = () => {
    setError('');
    setProfileEmailInput(profileEmail);
    setProfileEmailMarketingOptOut(Boolean(profile.profileEmailMarketingOptOut));
    setProfileEmailCode('');
    setProfileEmailStep('edit');
    setProfileEmailNotice('');
    setDialog('profile-email');
  };

  const savePreference = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (dialog === 'personal') {
        await API.put(`/user/profiles/${profile._id}`, { name: name.trim(), avatarUrl: profileAvatar });
      }
      if (dialog === 'language') {
        const selectedLanguages = [...new Set([...preferredAudioLanguages, language])];
        await API.put(`/user/profiles/${profile._id}`, { language, preferredAudioLanguages: selectedLanguages });
      }
      if (dialog === 'parental') await API.put(`/user/profiles/${profile._id}`, { maturityLimit: maturity });
      if (dialog === 'playback') await API.put(`/user/profiles/${profile._id}`, { autoplayNext, autoplayPreviews, dataUsage });
      if (dialog === 'notifications') await API.put(`/user/profiles/${profile._id}`, { notificationPreferences });
      if (dialog === 'subtitles') {
        localStorage.setItem(`sf_subtitle_appearance_${profile._id}`, JSON.stringify(subtitleAppearance));
        const scale = { small: '75', medium: '100', large: '125' }[subtitleAppearance.size] || subtitleScale;
        localStorage.setItem(`sf_subtitle_scale_${profile._id}`, scale);
      }
      if (dialog !== 'subtitles') await loadMe();
      if (dialog === 'personal' && isYourProfile) {
        selectProfile({ ...profile, name: name.trim(), avatarUrl: profileAvatar });
      }
      setDialog(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this preference. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const cancelSubtitleAppearance = () => {
    setSubtitleAppearance(readSubtitleAppearance(profile._id));
    setSubtitleScale(localStorage.getItem(`sf_subtitle_scale_${profile._id}`) || '100');
    setError('');
    setDialog(null);
  };

  const updateNotificationPreferences = async (changes) => {
    if (busy) return;
    const previous = notificationPreferences;
    const next = { ...previous, ...changes };
    setNotificationPreferences(next);
    setBusy(true);
    setError('');
    try {
      await API.put(`/user/profiles/${profile._id}`, { notificationPreferences: changes });
    } catch (err) {
      setNotificationPreferences(previous);
      const serverMessage = err.response?.data?.message;
      const outdatedNotificationApi = /notification preferences must contain/i.test(serverMessage || '');
      setError(
        outdatedNotificationApi
          ? 'The backend is using an older notification settings API. Restart it locally or redeploy the latest backend, then try again.'
          : serverMessage || 'Could not update notification preferences. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const updateDataSharingPreference = async () => {
    if (busy) return;
    const nextValue = !dataSharingOptOut;
    setDataSharingOptOut(nextValue);
    setBusy(true);
    setError('');
    try {
      await API.put(`/user/profiles/${profile._id}`, { dataSharingOptOut: nextValue });
      await loadMe();
    } catch (err) {
      setDataSharingOptOut(!nextValue);
      setError(err.response?.data?.message || 'Could not update this privacy setting. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (dialog === 'language') {
    return (
      <div className="nx-language-preferences-page">
        <header className="nx-language-preferences-header">
          <button type="button" onClick={() => nav('/browse')} aria-label="Newflix home">
            <img src="/newflix.png" alt="Newflix" />
          </button>
        </header>
        <main className="nx-language-preferences-main">
          <button type="button" className="nx-language-back" onClick={() => setDialog(null)} aria-label="Back to profile preferences">
            <IconChevronLeft size={22} />
          </button>
          <form className="nx-language-preferences-form" onSubmit={savePreference}>
            <h1>Set language preferences</h1>
            <p className="nx-language-profile">
              For <strong>{profile.name}</strong>
              <img src={profile.avatarUrl || avatar} alt="" />
            </p>

            <label className="nx-language-display-label" id="nx-profile-display-language-label" htmlFor="nx-profile-display-language">Display Language</label>
            <div className="nx-language-display-control" ref={displayLanguageRef}>
              <button
                id="nx-profile-display-language"
                type="button"
                className="nx-language-display-select"
                aria-label={`Display Language: ${PROFILE_LANGUAGES.find((item) => item.value === language)?.label || 'English'}`}
                aria-haspopup="listbox"
                aria-expanded={displayLanguageOpen}
                onClick={() => setDisplayLanguageOpen((open) => !open)}
              >
                <span>{PROFILE_LANGUAGES.find((item) => item.value === language)?.label || 'English'}</span>
                <span className={`nx-language-display-caret${displayLanguageOpen ? ' is-open' : ''}`} aria-hidden="true" />
              </button>
              {displayLanguageOpen && (
                <div className="nx-language-display-menu" role="listbox" aria-labelledby="nx-profile-display-language-label">
                  {[...PROFILE_LANGUAGES.filter((item) => item.value === language), ...PROFILE_LANGUAGES.filter((item) => item.value !== language)
                    .sort((first, second) => first.label.localeCompare(second.label))].map((item) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.value === language}
                      className={`nx-language-display-option${item.value === language ? ' is-selected' : ''}`}
                      key={item.value}
                      onClick={() => {
                        setLanguage(item.value);
                        setPreferredAudioLanguages((current) => (
                          current.includes(item.value) ? current : [...current, item.value]
                        ));
                        setDisplayLanguageOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.value === language && <span className="nx-language-display-check" aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="nx-language-display-help">
              This controls the text you see on Newflix. Any change will also apply to the default language for audio and subtitles.
            </p>

            <section className="nx-language-audio-section" aria-labelledby="nx-audio-language-heading">
              <h2 id="nx-audio-language-heading">Audio and subtitle languages</h2>
              <p>Choosing the languages you watch TV shows and movies in helps us set up your audio and subtitles for a better viewing experience.</p>
              <div className="nx-language-options">
                {PROFILE_LANGUAGES.map((item) => (
                  <label className="nx-language-option" key={item.value}>
                    <input
                      type="checkbox"
                      checked={preferredAudioLanguages.includes(item.value)}
                      onChange={(event) => setPreferredAudioLanguages((current) => (
                        event.target.checked
                          ? [...new Set([...current, item.value])]
                          : current.filter((value) => value !== item.value)
                      ))}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
            <div className="nx-language-actions">
              <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
            </div>
          </form>
        </main>
        <footer className="nx-language-footer">
          <div className="nx-language-footer-inner">
            <p>Questions? <a href="/p/contact">Contact Us</a></p>
            <nav aria-label="Footer links">
              <a href="/p/investor-relations">Investor Relations</a>
              <a href="/p/media-center">Media Center</a>
              <a href="/p/jobs">Jobs</a>
              <a href="/p/cookie-preferences">Cookie Preferences</a>
              <a href="/p/terms">Terms of Use</a>
              <a href="/p/privacy">Privacy Statement</a>
              <a href="/p/audio-subtitles">Audio and Subtitles</a>
              <a href="/p/help-center">Help Center</a>
              <a href="/p/gift-cards">Gift Cards</a>
              <a href="/p/ad-choices">Ad Choices</a>
            </nav>
          </div>
        </footer>
      </div>
    );
  }

  const addRestrictedTitle = (value) => {
    const title = String(value || '').trim();
    if (!title) return;
    setRestrictedTitles((current) => current.some((item) => item.toLocaleLowerCase() === title.toLocaleLowerCase())
      ? current
      : [...current, title]);
    setRestrictedTitleQuery('');
    setTitleSearchResults([]);
    setTitleSearchError('');
  };

  const saveParentalControls = async () => {
    setBusy(true);
    setError('');
    try {
      await API.put(`/user/profiles/${profile._id}`, {
        maturityLimit: kidsProfile ? '7+' : maturity,
        isKidsProfile: kidsProfile,
        restrictedTitles,
        ticket: lockTicket,
      });
      await loadMe();
      setLockTicket('');
      setDialog(null);
      showActionToast('Viewing Restrictions saved.', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save parental controls. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const savePlaybackSettings = async () => {
    setBusy(true);
    setError('');
    try {
      await API.put(`/user/profiles/${profile._id}`, { autoplayNext, autoplayPreviews, dataUsage });
      await loadMe();
      setDialog(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save playback settings. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const deleteProfile = async () => {
    setBusy(true);
    setError('');
    try {
      await API.delete(`/user/profiles/${profile._id}`);
      if (isYourProfile) selectProfile(null);
      await loadMe();
      setDeleteConfirm(false);
      nav('/account?section=profiles', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this profile. Please try again.');
      setDeleteConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  const openHistory = (source = 'preferences') => {
    if (profile.profileLockEnabled && !isYourProfile) {
      nav('/profiles');
      return;
    }
    selectProfile(profile);
    nav(`/history?from=${source}`);
  };

  const dialogTitle = {
    personal: 'Edit Profile',
    'profile-email': profileEmailStep === 'edit' ? 'Add profile email' : 'Verify your email',
    language: 'Languages',
    parental: 'Adjust parental controls',
    playback: 'Playback settings',
    subtitles: 'Subtitle appearance',
    notifications: 'Notification settings',
  }[dialog];

  if (dialog === 'privacy') {
    return (
      <div className="nx-account-page nx-security-page nx-profile-detail-page nx-privacy-detail-page">
        <AccountHeader avatar={avatar} nav={nav} logout={logout} />
        <main className="nx-profile-detail-main nx-privacy-detail-main">
          <div className="nx-profile-settings-view nx-privacy-settings-view">
            <button type="button" className="nx-profile-settings-back" onClick={() => setDialog(null)} aria-label="Back to profile preferences"><IconChevronLeft size={19} /></button>
            <div className="nx-profile-settings-body nx-privacy-settings-body">
              <h1>Manage privacy and data settings</h1>
              <p className="nx-privacy-for">For <strong>{profile.name}</strong><img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" /></p>

              <h2 className="nx-privacy-section-title">Viewing Privacy</h2>
              <section className="nx-security-card nx-privacy-viewing-card" aria-label="Viewing privacy">
                <ProfileSettingsRow
                  icon={<IconLockLine size={20} />}
                  title="Profile Lock"
                  detail={profile.profileLockEnabled ? 'Require a PIN to access this profile' : 'Add a PIN to make this profile private'}
                  onClick={() => { setLockStep('overview'); setDialog('lock'); setLockError(''); }}
                />
                <ProfileSettingsRow
                  icon={<IconClock size={20} />}
                  title="Viewing activity"
                  detail="Manage your watch history and ratings"
                  onClick={() => openHistory('privacy')}
                />
              </section>

              <h2 className="nx-privacy-section-title nx-privacy-data-heading">Data Privacy</h2>
              <section className="nx-security-card nx-privacy-data-card" aria-label="Data privacy">
                <p>You have the ability to opt out of sharing certain information you provide to Newflix with third parties. You are not providing any such information to Newflix, but can exercise your choice below.</p>
                {error && <p className="nx-privacy-error" role="alert">{error}</p>}
                <button
                  type="button"
                  className={`nx-privacy-optout${dataSharingOptOut ? ' is-opted-out' : ''}`}
                  onClick={updateDataSharingPreference}
                  disabled={busy}
                >
                  {busy ? 'Saving…' : dataSharingOptOut ? 'Opted Out of Data Sharing' : 'Opt Out of Data Sharing'}
                </button>
                {dataSharingOptOut && !busy && <p className="nx-privacy-saved" role="status">Your choice is saved for this profile.</p>}
              </section>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (dialog === 'playback') {
    return (
      <div className="nx-account-page nx-security-page nx-profile-detail-page nx-playback-detail-page">
        <AccountHeader avatar={avatar} nav={nav} logout={logout} />
        <main className="nx-profile-detail-main nx-playback-detail-main">
          <div className="nx-profile-settings-view nx-playback-settings-view">
            <button type="button" className="nx-profile-settings-back" onClick={() => setDialog(null)} aria-label="Back to profile preferences"><IconChevronLeft size={19} /></button>
            <div className="nx-profile-settings-body nx-playback-settings-body">
              <h1>Playback Settings</h1>
              <div className="nx-playback-profile">
                <img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />
                <span>For <strong>{profile.name}</strong></span>
              </div>
              <section className="nx-playback-section" aria-label="Autoplay settings">
                <label className="nx-playback-toggle">
                  <span><strong>Autoplay next episode</strong><small>Automatically play the next episode in a series on all devices.</small></span>
                  <input type="checkbox" role="switch" checked={autoplayNext} onChange={(event) => setAutoplayNext(event.target.checked)} />
                </label>
                <label className="nx-playback-toggle">
                  <span><strong>Autoplay previews</strong><small>Play previews while browsing on all devices.</small></span>
                  <input type="checkbox" role="switch" checked={autoplayPreviews} onChange={(event) => setAutoplayPreviews(event.target.checked)} />
                </label>
              </section>
              <section className="nx-playback-section nx-playback-data-section" aria-labelledby="nx-playback-data-title">
                <h2 id="nx-playback-data-title">Data usage per screen</h2>
                <p>Adjust video quality to manage how much data playback uses.</p>
                <div className="nx-playback-data-options">
                  {[
                    ['auto', 'Auto', 'Adjusts automatically to deliver the best experience for your connection.'],
                    ['low', 'Low', 'Uses the least data.'],
                    ['medium', 'Medium', 'Uses less data than High.'],
                    ['high', 'High', 'Best video quality. Uses the most data.'],
                  ].map(([value, label, description]) => (
                    <label className="nx-playback-radio" key={value}>
                      <input type="radio" name="playback-data-usage" value={value} checked={dataUsage === value} onChange={() => setDataUsage(value)} />
                      <span><strong>{label}</strong><small>{description}</small></span>
                    </label>
                  ))}
                </div>
                <p className="nx-playback-data-note">Quality limits apply to HLS streams controlled by the player. Native browser and external providers may choose their own quality.</p>
              </section>
              {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
              <div className="nx-parental-actions nx-playback-actions">
                <button type="button" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
                <button type="button" onClick={savePlaybackSettings} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </main>
        <footer className="nx-devices-footer">
          <p>Questions? <a href="/p/contact">Contact Us</a></p>
          <nav aria-label="Footer links">
            <a href="/p/investor-relations">Investor Relations</a><a href="/p/terms">Terms of Use</a>
            <a href="/p/gift-cards">Gift Cards</a><a href="/p/media-center">Media Center</a>
            <a href="/p/privacy">Privacy Statement</a><a href="/p/audio-subtitles">Audio and Subtitles</a>
            <a href="/p/jobs">Jobs</a><a href="/p/help-center">Help Center</a>
            <a href="/p/cookie-preferences">Cookie Preferences</a>
          </nav>
        </footer>
      </div>
    );
  }

  if (dialog === 'subtitles') {
    const previewFont = {
      casual: 'Arial, Helvetica, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      monospace: '"Courier New", monospace',
    }[subtitleAppearance.font];
    const previewSize = { small: '14px', medium: '18px', large: '23px' }[subtitleAppearance.size];
    const previewShadow = {
      none: 'none',
      drop: '0 2px 3px rgba(0,0,0,.95)',
      raised: '0 -2px 2px rgba(0,0,0,.9)',
      uniform: '0 0 3px #000, 0 0 6px #000',
    }[subtitleAppearance.shadow];
    const previewTextStyle = {
      color: subtitleAppearance.textColor,
      fontFamily: previewFont,
      fontSize: previewSize,
      textShadow: previewShadow,
      backgroundColor: subtitleAppearance.backgroundTransparent ? 'transparent' : subtitleAppearance.backgroundColor,
    };

    return (
      <div className="nx-account-page nx-security-page nx-profile-detail-page nx-subtitle-detail-page">
        <AccountHeader avatar={avatar} nav={nav} logout={logout} />
        <main className="nx-profile-detail-main nx-subtitle-detail-main">
          <div className="nx-profile-settings-view nx-subtitle-settings-view">
            <button type="button" className="nx-profile-settings-back" onClick={cancelSubtitleAppearance} aria-label="Back to profile preferences"><IconChevronLeft size={19} /></button>
            <form
              className="nx-profile-settings-body nx-subtitle-settings-body"
              onSubmit={savePreference}
              onChange={() => setError('')}
            >
              <h1>Subtitle Appearance</h1>
              <p className="nx-subtitle-intro">Change the way subtitles appear for <strong>{profile.name}</strong> on supported devices.</p>
              <p className="nx-subtitle-device-note">Your choices are saved for this profile on this device.</p>

              <section className="nx-subtitle-preview" aria-label="Subtitle preview">
                <div className="nx-subtitle-preview-screen">
                  <span style={{
                    ...previewTextStyle,
                    outline: subtitleAppearance.windowTransparent ? 'none' : `8px solid ${subtitleAppearance.windowColor}`,
                  }}>These settings affect subtitles on supported devices.</span>
                </div>
                <p>Preview</p>
              </section>

              <div className="nx-subtitle-controls">
                <label className="nx-subtitle-control">
                  <span>Font</span>
                  <select value={subtitleAppearance.font} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, font: event.target.value }))}>
                    <option value="casual">Casual</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </label>

                <fieldset className="nx-subtitle-size-control">
                  <legend>Text size</legend>
                  <div role="group" aria-label="Subtitle text size">
                    {[
                      ['small', 'A', 'Small'],
                      ['medium', 'A', 'Medium'],
                      ['large', 'A', 'Large'],
                    ].map(([value, label, accessibleLabel]) => (
                      <button
                        type="button"
                        key={value}
                        className={subtitleAppearance.size === value ? 'is-selected' : ''}
                        aria-label={accessibleLabel}
                        aria-pressed={subtitleAppearance.size === value}
                        onClick={() => {
                          setSubtitleAppearance((current) => ({ ...current, size: value }));
                          setSubtitleScale({ small: '75', medium: '100', large: '125' }[value]);
                        }}
                      >{label}</button>
                    ))}
                  </div>
                </fieldset>

                <label className="nx-subtitle-control">
                  <span>Shadow</span>
                  <select value={subtitleAppearance.shadow} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, shadow: event.target.value }))}>
                    <option value="drop">Drop shadow</option>
                    <option value="raised">Raised</option>
                    <option value="uniform">Uniform</option>
                    <option value="none">None</option>
                  </select>
                </label>

                <label className="nx-subtitle-color-control">
                  <span>Text color</span>
                  <input type="color" value={subtitleAppearance.textColor} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, textColor: event.target.value }))} aria-label="Subtitle text color" />
                </label>
                <label className="nx-subtitle-color-control">
                  <span>Background</span>
                  <input type="color" value={subtitleAppearance.backgroundColor} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, backgroundColor: event.target.value }))} disabled={subtitleAppearance.backgroundTransparent} aria-label="Subtitle background color" />
                  <span className="nx-subtitle-transparent"><input type="checkbox" checked={subtitleAppearance.backgroundTransparent} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, backgroundTransparent: event.target.checked }))} /> Transparent</span>
                </label>
                <label className="nx-subtitle-color-control">
                  <span>Window</span>
                  <input type="color" value={subtitleAppearance.windowColor} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, windowColor: event.target.value }))} disabled={subtitleAppearance.windowTransparent} aria-label="Subtitle window color" />
                  <span className="nx-subtitle-transparent"><input type="checkbox" checked={subtitleAppearance.windowTransparent} onChange={(event) => setSubtitleAppearance((current) => ({ ...current, windowTransparent: event.target.checked }))} /> Transparent</span>
                </label>
              </div>

              {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
              <div className="nx-parental-actions nx-subtitle-actions">
                <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                <button type="button" className="nx-subtitle-reset" disabled={busy} onClick={() => {
                  setSubtitleAppearance({ ...DEFAULT_SUBTITLE_APPEARANCE });
                  setSubtitleScale('100');
                }}>Reset to default</button>
                <button type="button" className="nx-subtitle-cancel" disabled={busy} onClick={cancelSubtitleAppearance}>Cancel</button>
              </div>
            </form>
          </div>
        </main>
        <footer className="nx-devices-footer">
          <p>Questions? <a href="/p/contact">Contact Us</a></p>
          <nav aria-label="Footer links">
            <a href="/p/investor-relations">Investor Relations</a><a href="/p/terms">Terms of Use</a>
            <a href="/p/gift-cards">Gift Cards</a><a href="/p/media-center">Media Center</a>
            <a href="/p/privacy">Privacy Statement</a><a href="/p/audio-subtitles">Audio and Subtitles</a>
            <a href="/p/jobs">Jobs</a><a href="/p/help-center">Help Center</a>
            <a href="/p/cookie-preferences">Cookie Preferences</a>
          </nav>
        </footer>
      </div>
    );
  }

  if (dialog === 'notifications') {
    const notificationGroups = [
      {
        title: 'Just For You',
        options: [
          { key: 'watch', title: 'What you watch', description: 'New seasons & episodes, leaving soon, your collections', icon: <IconFilmLine size={17} /> },
          { key: 'recommendations', title: 'Watch recommendations & more', description: 'Top 10, new titles, picks for you', icon: <IconSparklesLine size={17} /> },
          { key: 'surveys', title: 'Surveys & research invites', description: 'Participate in studies, surveys', icon: <IconMailLine size={17} /> },
        ],
      },
      {
        title: 'Discover More',
        options: [
          { key: 'games', title: 'Newflix Games', description: 'Releases, recommendations, gameplay activity', icon: <IconFlaskLine size={17} /> },
          { key: 'shop', title: 'Newflix Shop & experiences', description: 'Newflix Shop products, Newflix live experiences', icon: <IconCreditCardLine size={17} /> },
          { key: 'usingApp', title: 'Using the Newflix app', description: 'Suggested features, tips & tricks, parental controls', icon: <IconDevicesLine size={17} /> },
        ],
      },
      {
        title: 'Your Account',
        options: [
          { key: 'membershipOffers', title: 'Membership offers', description: 'Plan upgrades, subscription promotions', icon: <IconCreditCardLine size={17} /> },
          { key: 'accountUpdates', title: 'Account updates', description: 'Security alerts, billing, time-sensitive notifications', icon: <IconPersonAccessLine size={17} /> },
        ],
      },
    ];
    const allNotificationKeys = notificationGroups.flatMap((group) => group.options.map((option) => option.key));
    const unsubscribeFromAll = () => updateNotificationPreferences(
      Object.fromEntries(allNotificationKeys.map((key) => [key, false])),
    );

    return (
      <div className="nx-account-page nx-security-page nx-profile-detail-page nx-notification-detail-page">
        <AccountHeader avatar={avatar} nav={nav} logout={logout} />
        <main className="nx-notification-main">
          <h1>Push Notifications</h1>
          <p className="nx-notification-subtitle">Alerts sent to mobile devices using Newflix</p>
          <section className="nx-notification-device-card" aria-label="Notification device">
            <img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />
            <strong>{profile.name}</strong>
            <button type="button" onClick={() => nav('/account?section=devices')}>View Devices</button>
          </section>
          <p className="nx-notification-device-note"><IconInfo size={14} /> You may also need to enable push notifications in your device&apos;s settings.</p>

          {notificationGroups.map((group) => (
            <section className="nx-notification-group" key={group.title} aria-label={group.title}>
              <h2>{group.title}</h2>
              <div className="nx-notification-options">
                {group.options.map((option) => (
                  <div className="nx-notification-row" key={option.key}>
                    <span className="nx-notification-icon" aria-hidden="true">{option.icon}</span>
                    <span className="nx-notification-copy">
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      className="nx-notification-switch"
                      aria-checked={notificationPreferences[option.key] !== false}
                      aria-label={`${option.title} notifications`}
                      disabled={busy}
                      onClick={() => updateNotificationPreferences({
                        [option.key]: notificationPreferences[option.key] === false,
                      })}
                    >
                      <span />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {error && <p className="nx-notification-error" role="alert">{error}</p>}
          {busy && <p className="nx-notification-saving" role="status">Saving your notification settings…</p>}
          <div className="nx-notification-unsubscribe">
            <button type="button" onClick={unsubscribeFromAll} disabled={busy}>
              {allNotificationKeys.every((key) => notificationPreferences[key] === false) ? 'All Notifications Off' : 'Unsubscribe From All'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (dialog === 'parental' || dialog === 'parental-confirm') {
    if (dialog === 'parental-confirm') {
      const backToMethods = () => {
        setLockError('');
        setLockNotice('');
        setLockPassword('');
        setLockCode('');
        setLockStep('confirm');
      };
      const closeConfirmation = () => {
        setLockTicket('');
        closeLockPage();
      };

      return (
        <div className="nx-account-page nx-security-page nx-profile-detail-page nx-parental-verification-page">
          <AccountHeader avatar={avatar} nav={nav} logout={logout} />
          <main className="nx-parental-verification-main">
            <button type="button" className="nx-profile-settings-back" onClick={lockStep === 'confirm' ? closeConfirmation : backToMethods} aria-label={lockStep === 'confirm' ? 'Back to profile preferences' : 'Back to verification methods'}>
              <IconChevronLeft size={19} />
            </button>
            <section className="nx-parental-verification-content">
              {lockStep === 'confirm' && (
                <>
                  <h1>First, let&apos;s make sure it&apos;s you</h1>
                  <p>Before we make any changes, we&apos;ll just need a quick confirmation.</p>
                  <button type="button" className="nx-parental-verification-method" onClick={() => requestLockEmailCode('parental')} disabled={busy}>
                    <IconMailLine size={20} />
                    <span><strong>Email a code</strong><small>{maskedEmail}</small></span>
                    <IconChevronRight size={18} />
                  </button>
                  <button type="button" className="nx-parental-verification-method" onClick={() => requestLockSMSCode('parental')} disabled={busy}>
                    <IconPhoneLine size={20} />
                    <span><strong>Text a code</strong><small>Send to your verified mobile number</small></span>
                    <IconChevronRight size={18} />
                  </button>
                  <button type="button" className="nx-parental-verification-method" onClick={() => { setLockError(''); setLockStep('password'); }} disabled={busy}>
                    <IconLockLine size={20} />
                    <span><strong>Confirm password</strong></span>
                    <IconChevronRight size={18} />
                  </button>
                  {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
                  <small className="nx-profile-lock-help">Need help? <a href="/p/help-center">Visit the Help Center</a></small>
                </>
              )}
              {lockStep === 'password' && (
                <form className="nx-parental-verification-form" onSubmit={(event) => confirmLockPassword(event, 'parental')}>
                  <h1>Confirm your password</h1>
                  <p>Please enter your account password to continue.</p>
                  <label>Current Password<span className="nx-profile-lock-password-wrap"><input type={lockPasswordVisible ? 'text' : 'password'} value={lockPassword} onChange={(event) => setLockPassword(event.target.value)} autoComplete="current-password" required autoFocus /><button type="button" onClick={() => setLockPasswordVisible((visible) => !visible)} aria-label={lockPasswordVisible ? 'Hide password' : 'Show password'} aria-pressed={lockPasswordVisible}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></button></span></label>
                  {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
                  <button type="submit" disabled={busy || !lockPassword}>{busy ? 'Checking…' : 'Continue'}</button>
                  <button type="button" className="nx-parental-verification-secondary" onClick={backToMethods} disabled={busy}>Choose another method</button>
                </form>
              )}
              {lockStep === 'otp' && (
                <form className="nx-parental-verification-form" onSubmit={(event) => verifyLockEmailCode(event, 'parental')}>
                  <h1>Enter the code we just sent</h1>
                  <p>{lockNotice || `Enter the 6-digit code sent to ${lockDelivery === 'sms' ? 'your verified mobile number' : maskedEmail}. The code expires in 10 minutes.`}</p>
                  <ProfileCodeFields count={6} value={lockCode} onChange={setLockCode} label={`${lockDelivery === 'sms' ? 'Text message' : 'Email'} verification code`} />
                  {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
                  <button type="submit" disabled={busy || lockCode.length !== 6}>{busy ? 'Verifying…' : 'Continue'}</button>
                  <button type="button" className="nx-parental-verification-secondary" onClick={() => (lockDelivery === 'sms' ? requestLockSMSCode('parental') : requestLockEmailCode('parental'))} disabled={busy}>{busy ? 'Sending…' : 'Resend code'}</button>
                  <button type="button" className="nx-parental-verification-secondary" onClick={backToMethods} disabled={busy}>Choose another method</button>
                </form>
              )}
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="nx-account-page nx-security-page nx-profile-detail-page nx-parental-controls-page">
        <AccountHeader avatar={avatar} nav={nav} logout={logout} />
        <main className="nx-parental-controls-main">
          <div className="nx-parental-control-body">
              <div className="nx-parental-heading">
                <h1>Adjust Parental Controls</h1>
                <img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt={`${profile.name} profile`} />
              </div>
              <section className="nx-parental-section nx-parental-rating">
                <h2>Profile Maturity Rating for {profile.name}</h2>
                <p>{maturity === 'ALL' ? 'Show titles of all maturity ratings for this profile.' : `Show titles rated ${maturity} and below for this profile.`} <a href="/p/help-center">Learn more about maturity ratings</a> for games.</p>
                <div className="nx-parental-rating-slider">
                  <input
                    type="range"
                    min="0"
                    max={PROFILE_MATURITY_OPTIONS.length - 1}
                    step="1"
                    value={PROFILE_MATURITY_OPTIONS.findIndex((item) => item.value === maturity)}
                    aria-label="Maximum profile age rating"
                    disabled={kidsProfile}
                    style={{ '--rating-progress': `${(PROFILE_MATURITY_OPTIONS.findIndex((item) => item.value === maturity) / (PROFILE_MATURITY_OPTIONS.length - 1)) * 100}%` }}
                    onChange={(event) => setMaturity(PROFILE_MATURITY_OPTIONS[Number(event.target.value)].value)}
                  />
                  <div className="nx-parental-rating-ticks">
                    {PROFILE_MATURITY_OPTIONS.map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={item.value === maturity ? 'is-selected' : ''}
                        aria-pressed={item.value === maturity}
                        disabled={kidsProfile}
                        onClick={() => setMaturity(item.value)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
              <section className="nx-parental-section nx-parental-kids">
                <h2>Kids Profile</h2>
                <label><input type="checkbox" checked={kidsProfile} onChange={(event) => setKidsProfile(event.target.checked)} /> <span>Display the Netflix Kids experience with titles just for kids.</span></label>
              </section>
              <section className="nx-parental-section nx-parental-title-restrictions">
                <h2>Title Restrictions for {profile.name}</h2>
                <p>Don&apos;t show specific titles for this profile regardless of Maturity Rating</p>
                <div className="nx-parental-title-search">
                  <input
                    type="search"
                    value={restrictedTitleQuery}
                    onChange={(event) => setRestrictedTitleQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addRestrictedTitle(restrictedTitleQuery);
                      }
                    }}
                    placeholder="Enter show or movie name"
                    aria-label="Search for a title to restrict"
                  />
                  {titleSearchResults.length > 0 && (
                    <div className="nx-parental-title-results" role="listbox" aria-label="Title search results">
                      {titleSearchResults.map((item) => (
                        <button type="button" role="option" aria-selected="false" key={item._id} onClick={() => addRestrictedTitle(item.title || item.name)}>
                          {item.title || item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {titleSearchError && <p className="nx-parental-search-error" role="status">{titleSearchError}</p>}
                <ul className="nx-parental-restricted-list">
                  {restrictedTitles.map((title) => (
                    <li key={title}>
                      <span>{title}</span>
                      <button type="button" aria-label={`Remove ${title} from title restrictions`} onClick={() => setRestrictedTitles((current) => current.filter((item) => item !== title))}>×</button>
                    </li>
                  ))}
                </ul>
              </section>
              {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
              <div className="nx-parental-actions">
                <button type="button" onClick={saveParentalControls} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setDialog(null)} disabled={busy}>Cancel</button>
              </div>
          </div>
        </main>
        <footer className="nx-devices-footer nx-parental-controls-footer">
          <p>Questions? <a href="/p/contact">Contact us.</a></p>
          <nav aria-label="Footer links">
            <a href="/p/audio-subtitles">Audio and Subtitles</a>
            <a href="/p/help-center">Help Center</a>
            <a href="/p/gift-cards">Gift Cards</a>
            <a href="/p/investor-relations">Investor Relations</a>
            <a href="/p/media-center">Media Center</a>
            <a href="/p/jobs">Jobs</a>
            <a href="/p/cookie-preferences">Cookie Preferences</a>
            <a href="/p/terms">Terms of Use</a>
            <a href="/p/privacy">Privacy Statement</a>
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <div className="nx-account-page nx-security-page nx-profile-detail-page">
      <AccountHeader avatar={avatar} nav={nav} logout={logout} />
      <main className={`nx-profile-detail-main${dialog === 'lock' ? ' is-lock-view' : ''}`}>
        {dialog === 'lock' ? (
          <div className="nx-profile-lock-page">
            <button type="button" className="nx-profile-settings-back" onClick={closeLockPage} aria-label="Back to profile settings"><IconChevronLeft size={19} /></button>
            <div className="nx-profile-lock-content">
              {lockStep === 'pin' ? (
                <form onSubmit={saveProfileLockPIN}>
                  <h1>{profile.profileLockEnabled ? 'Edit your Profile Lock PIN' : 'Add a 4-digit PIN to create your Profile Lock'}</h1>
                  <p className="nx-profile-lock-description">You&apos;ll be asked to re-enter your PIN when you select your profile on any device.</p>
                  <ProfileCodeFields count={4} value={lockPin} onChange={setLockPin} label="4-digit profile PIN" />
                  <p className="nx-profile-lock-note">Note: a profile PIN is not required to make changes to profile settings or to delete a profile.</p>
                  {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
                  <div className="nx-profile-lock-actions">
                    <button type="submit" disabled={busy || lockPin.length !== 4}>{busy ? 'Saving…' : 'Save PIN'}</button>
                    <button type="button" onClick={() => { setLockStep('overview'); setLockError(''); }} disabled={busy}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1>{profile.profileLockEnabled ? 'Manage Profile Lock' : 'Create a Profile Lock'}</h1>
                  {lockNotice && <p className="nx-profile-lock-status-message" role="status">{lockNotice}</p>}
                  {profile.profileLockEnabled ? (
                    <>
                      <section className="nx-profile-lock-status-card">
                        <IconLockLine size={18} />
                        <span><strong>Profile Lock</strong><small>On</small></span>
                      </section>
                      <div className="nx-profile-lock-actions">
                        <button type="button" onClick={() => beginLockAction('set')}>Edit PIN</button>
                        <button type="button" className="is-secondary" onClick={() => beginLockAction('delete')}>Delete PIN</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="nx-profile-lock-for">For <span className="nx-profile-lock-avatar"><img src={profile.avatarUrl || avatar} alt="" /></span> {profile.name}</p>
                      <p className="nx-profile-lock-description">Make this profile private by adding a 4-digit PIN that will need to be entered to access it.</p>
                      <button type="button" className="nx-profile-lock-create" onClick={() => beginLockAction('set')}>Create a Profile Lock</button>
                    </>
                  )}
                  <p className="nx-profile-lock-note">Note: You&apos;ll be asked to enter the account password when making changes to profile lock.</p>
                  <button type="button" className="nx-profile-lock-back-link" onClick={closeLockPage}>Back to profile settings</button>
                  {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="nx-profile-settings-view">
            <button type="button" className="nx-profile-settings-back" onClick={goBack} aria-label="Back to profiles"><IconChevronLeft size={19} /></button>
            <div className="nx-profile-settings-body">
              <h1>Manage profile and preferences</h1>
              <section className="nx-security-card nx-profile-preferences-card" aria-label="Profile and preferences">
                <div className="nx-profile-pref-row nx-profile-edit-row">
                  <button type="button" className="nx-profile-edit-avatar" onClick={() => openDialog('personal')} aria-label={`Edit ${profile.name}'s profile image`}>
                    <img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />
                    <span aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.8 2.8 0 0 0-4-4L4.8 15.8 4 20Z" />
                      </svg>
                    </span>
                  </button>
                  <button type="button" className="nx-profile-edit-copy" onClick={() => openDialog('personal')}>
                    <strong>{profile.name}</strong>
                    <small>Edit personal and contact info</small>
                  </button>
                  <IconChevronRight size={18} />
                </div>
                <ProfileSettingsRow icon={<IconLockLine size={18} />} title="Profile Lock" detail={profile.profileLockEnabled ? 'Profile Lock is on' : 'Require a PIN to access this profile'} onClick={() => { setLockStep('overview'); setDialog('lock'); setLockError(''); }} />
              </section>
              <h2 className="nx-profile-preferences-title">Preferences</h2>
              <section className="nx-security-card nx-profile-preferences-card" aria-label="Preferences">
                <ProfileSettingsRow icon={<IconAudio size={18} />} title="Languages" detail={`Set languages for display and audio · ${PROFILE_LANGUAGES.find((item) => item.value === normalizeProfileLanguage(profile.language))?.label || 'English'}`} onClick={() => openDialog('language')} />
                <ProfileSettingsRow icon={<IconWarningTriangleLine size={18} />} title="Adjust Parental Controls" detail="Edit maturity rating and title restrictions" onClick={beginParentalConfirmation} />
                <ProfileSettingsRow icon={<IconSettings size={18} />} title="Subtitle appearance" detail="Customize the way subtitles appear" onClick={() => openDialog('subtitles')} />
                <ProfileSettingsRow icon={<IconCheck size={18} />} title="Playback settings" detail="Set autoplay and video quality" onClick={() => openDialog('playback')} />
                <ProfileSettingsRow icon={<IconInfo size={18} />} title="Viewing activity" detail="Manage viewing history and ratings" onClick={openHistory} />
                <ProfileSettingsRow icon={<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>} title="Notification settings" detail="Manage notifications for email, text, push" onClick={() => openDialog('notifications')} />
                <ProfileSettingsRow icon={<IconShieldCheckLine size={18} />} title="Privacy and data settings" detail="Manage use of personal info" onClick={() => openDialog('privacy')} />
                <ProfileSettingsRow icon={<IconTransferLine size={18} />} title="Profile transfer" detail="Copy this profile to another account" onClick={() => nav('/profiles?settings=1')} />
              </section>
              <button type="button" className="nx-profile-delete" onClick={() => { setError(''); setDeleteConfirm(true); }}><IconWarningTriangleLine size={16} /> Delete Profile</button>
              {error && !dialog && <p className="nx-profile-form-error" role="alert">{error}</p>}
            </div>
          </div>
        )}
      </main>

      {dialog === 'lock' && lockStep === 'confirm' && (
        <div className="nx-profile-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) closeLockPage(); }}>
          <section className="nx-profile-lock-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="nx-profile-lock-confirm-title">
            <button type="button" className="nx-profile-dialog-close" onClick={closeLockPage} disabled={busy} aria-label="Close">×</button>
            <h2 id="nx-profile-lock-confirm-title">First, let&apos;s make sure it&apos;s you</h2>
            <p>Before we make any changes, we&apos;ll just need a quick confirmation.</p>
            <button type="button" className="nx-profile-lock-method" onClick={requestLockEmailCode} disabled={busy}>
              <IconMailLine size={23} />              <span><strong>Email a code</strong><small>{maskedEmail}</small></span>
            </button>
            <button type="button" className="nx-profile-lock-method" onClick={() => { setLockError(''); setLockStep('password'); }} disabled={busy}>
              <IconLockLine size={23} /><span><strong>Confirm password</strong></span>
            </button>
            {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
            <small className="nx-profile-lock-help">Need help? <a href="/p/help-center">Visit the Help Center</a></small>
          </section>
        </div>
      )}

      {dialog === 'lock' && lockStep === 'password' && (
        <div className="nx-profile-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setLockStep('confirm'); }}>
          <form className="nx-profile-lock-password-dialog" onSubmit={confirmLockPassword}>
            <button type="button" className="nx-profile-dialog-close" onClick={() => setLockStep('confirm')} disabled={busy} aria-label="Close">×</button>
            <h2>Confirm your password</h2>
            <p>Please enter your account password.</p>
            <label>Current Password<span className="nx-profile-lock-password-wrap"><input type={lockPasswordVisible ? 'text' : 'password'} value={lockPassword} onChange={(event) => setLockPassword(event.target.value)} autoComplete="current-password" required autoFocus /><button type="button" onClick={() => setLockPasswordVisible((visible) => !visible)} aria-label={lockPasswordVisible ? 'Hide password' : 'Show password'} aria-pressed={lockPasswordVisible}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></button></span></label>
            {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
            <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Submit'}</button>
            <a href="/login/help">Create or reset password</a>
            <button type="button" className="nx-profile-lock-email-fallback" onClick={requestLockEmailCode} disabled={busy}>Use email verification instead</button>
          </form>
        </div>
      )}

      {dialog === 'lock' && lockStep === 'otp' && (
        <div className="nx-profile-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) closeLockPage(); }}>
          <form className="nx-profile-lock-otp-dialog" onSubmit={verifyLockEmailCode}>
            <button type="button" className="nx-profile-dialog-close" onClick={closeLockPage} disabled={busy} aria-label="Close">×</button>
            <h2>Enter the code we just sent</h2>
            <p>Please enter the code we sent to {maskedEmail} to help us protect your account. The code will expire 10 minutes after it is sent.</p>
            <ProfileCodeFields count={6} value={lockCode} onChange={setLockCode} label="Email verification code" />
            {lockError && <p className="nx-profile-form-error" role="alert">{lockError}</p>}
            <button type="submit" disabled={busy || lockCode.length !== 6}>{busy ? 'Verifying…' : 'Submit'}</button>
            <button type="button" className="nx-profile-lock-resend" onClick={requestLockEmailCode} disabled={busy}>{busy ? 'Sending…' : 'Resend Code'}</button>
            <small className="nx-profile-lock-help">Need help? <a href="/p/help-center">Visit the Help Center</a></small>
          </form>
        </div>
      )}

      {dialog && dialog !== 'lock' && dialog !== 'parental' && (
        <div className="nx-profile-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDialog(null); }}>
          <form
            className={`nx-profile-dialog${dialog === 'personal' ? ' nx-profile-edit-dialog' : ''}${dialog === 'profile-email' ? ' nx-profile-email-dialog' : ''}`}
            onSubmit={dialog === 'profile-email' ? (profileEmailStep === 'edit' ? sendProfileEmailCode : verifyProfileEmailCode) : savePreference}
            aria-labelledby="nx-profile-dialog-title"
          >
            <button type="button" className="nx-profile-dialog-close" onClick={() => setDialog(null)} disabled={busy} aria-label="Close">×</button>
            {dialog === 'profile-email' && (
              <button type="button" className="nx-profile-email-back" onClick={() => { setError(''); setDialog('personal'); }} disabled={busy} aria-label="Back to edit profile">
                <IconChevronLeft size={21} />
              </button>
            )}
            <h2 id="nx-profile-dialog-title">{dialogTitle}</h2>
            {dialog === 'personal' && (
              <>
                <input ref={avatarInputRef} className="nx-profile-avatar-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadProfileAvatar} aria-label="Choose a profile image" />
                <div className="nx-profile-edit-fields">
                  <button type="button" className="nx-profile-edit-photo" onClick={() => avatarInputRef.current?.click()} disabled={busy || avatarUploading} aria-label={avatarUploading ? 'Uploading profile image' : 'Edit profile image'}>
                    <img src={profileAvatar} alt="" />
                    <span aria-hidden="true">
                      {avatarUploading ? <i /> : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4M4 20l4.2-.8L19 8.4a2.8 2.8 0 0 0-4-4L4.8 15.8 4 20Z" /></svg>}
                    </span>
                  </button>
                  <label>Profile name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required autoFocus /></label>
                </div>
                {!profile.isKidsProfile && (
                  <>
                    <h3 className="nx-profile-edit-section-title">Contact Info</h3>
                    <button type="button" className="nx-profile-email-option" onClick={openProfileEmail}>
                      <IconMailLine size={19} />
                      <span><strong>Email</strong><small>{profileEmail || 'Add profile email'}</small></span>
                      <IconChevronRight size={18} />
                    </button>
                  </>
                )}
              </>
            )}
            {dialog === 'profile-email' && profileEmailStep === 'edit' && (
              <>
                <p className="nx-profile-email-for">For {profile.name} <span aria-hidden="true">☺</span></p>
                <p className="nx-profile-email-description">You&apos;ll be able to sign in to Newflix with your email. We&apos;ll also let you know about suggestions for what to watch, new features, special offers and surveys.</p>
                <label className="nx-profile-email-address">
                  <span className="nx-visually-hidden">Email address</span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={profileEmailInput}
                    onChange={(event) => setProfileEmailInput(event.target.value)}
                    maxLength={254}
                    required
                    autoFocus
                  />
                </label>
                <label className="nx-profile-email-optout">
                  <input type="checkbox" checked={profileEmailMarketingOptOut} onChange={(event) => setProfileEmailMarketingOptOut(event.target.checked)} />
                  <span>Please do not email me Newflix special offers.</span>
                </label>
                <p className="nx-profile-email-consent">I am at least 18 years old and I agree this information will be used for purposes consistent with the Newflix <a href="/p/privacy" target="_blank" rel="noreferrer">Privacy Statement</a>.</p>
              </>
            )}
            {dialog === 'profile-email' && profileEmailStep === 'verify' && (
              <>
                <p className="nx-profile-email-description">Enter the 6-digit code sent to <strong>{profileEmailInput}</strong>. The code expires in 10 minutes.</p>
                <ProfileCodeFields count={6} value={profileEmailCode} onChange={setProfileEmailCode} label="Profile email verification code" />
                <button type="button" className="nx-profile-email-resend" onClick={sendProfileEmailCode} disabled={busy}>Resend code</button>
              </>
            )}
            {dialog === 'language' && <label>Display and audio language<select value={language} onChange={(event) => setLanguage(event.target.value)}>{PROFILE_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
            {dialog === 'parental' && <label>Allowed maturity rating<select value={maturity} onChange={(event) => setMaturity(event.target.value)}>{PROFILE_MATURITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small>Titles above this rating will be restricted for this profile.</small></label>}
            {dialog === 'notifications' && (
              <div className="nx-profile-notification-options">
                <p>Choose how you&apos;d like to receive profile notifications.</p>
                {[
                  ['email', 'Email'],
                  ['text', 'Text message'],
                  ['push', 'Push notifications'],
                ].map(([channel, label]) => (
                  <label className="nx-profile-dialog-check" key={channel}>
                    <input
                      type="checkbox"
                      checked={notificationPreferences[channel]}
                      onChange={(event) => setNotificationPreferences((current) => ({ ...current, [channel]: event.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
            {profileEmailNotice && dialog === 'profile-email' && <p className="nx-profile-email-notice" role="status">{profileEmailNotice}</p>}
            {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
            {dialog !== 'lock' && <div className={`nx-profile-dialog-actions${dialog === 'personal' ? ' is-profile-edit-actions' : ''}${dialog === 'profile-email' ? ' is-profile-email-actions' : ''}`}><button type="button" onClick={() => { setError(''); if (dialog === 'profile-email' && profileEmailStep === 'verify') setProfileEmailStep('edit'); else setDialog(dialog === 'profile-email' ? 'personal' : null); }} disabled={busy || avatarUploading}>Cancel</button><button type="submit" disabled={busy || avatarUploading || (dialog === 'profile-email' && profileEmailStep === 'verify' && profileEmailCode.length !== 6)}>{busy ? (profileEmailStep === 'verify' && dialog === 'profile-email' ? 'Verifying…' : 'Sending…') : dialog === 'profile-email' ? (profileEmailStep === 'edit' ? 'Add email' : 'Verify email') : 'Save'}</button></div>}
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="nx-profile-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDeleteConfirm(false); }}>
          <section className="nx-profile-dialog nx-profile-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="nx-profile-delete-title">
            <button type="button" className="nx-profile-dialog-close" onClick={() => setDeleteConfirm(false)} disabled={busy} aria-label="Close">×</button>
            <h2 id="nx-profile-delete-title">Delete {profile.name}&apos;s profile?</h2>
            <p>This permanently removes this profile and its viewing activity and saved list.</p>
            {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
            <div className="nx-profile-dialog-actions"><button type="button" onClick={() => setDeleteConfirm(false)} disabled={busy}>Cancel</button><button type="button" className="is-danger" onClick={deleteProfile} disabled={busy}>{busy ? 'Deleting…' : 'Delete Profile'}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const { user, profiles, activeProfile, selectProfile, loadMe, logout } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const section = params.get('section') || 'overview';
  const profileId = params.get('profileId') || '';
  const extraStep = params.get('step') || '1';
  const [payments, setPayments] = useState([]);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    API.get('/user/payments')
      .then(({ data }) => setPayments(data.items || []))
      .catch(() => setPaymentError('Payment details are temporarily unavailable.'));
  }, []);

  const latestPayment = payments[0];
  const planName = latestPayment?.plan || (user?.signupPlan ? `${user.signupPlan[0].toUpperCase()}${user.signupPlan.slice(1)} plan` : 'Membership plan');
  const nextPayment = useMemo(() => {
    if (!latestPayment?.createdAt) return null;
    const date = new Date(latestPayment.createdAt);
    date.setMonth(date.getMonth() + 1);
    return date;
  }, [latestPayment]);
  const avatar = activeProfile?.avatarUrl || profiles?.[0]?.avatarUrl || '/Netflix-avatar-1.png';
  const settingsProfileId = activeProfile?._id || profiles?.[0]?._id;

  if (section === 'extra-member') return <ExtraMemberView step={extraStep} user={user} nav={nav} logout={logout} />;
  if (section === 'manage-membership') return <ManageMembershipView user={user} nav={nav} logout={logout} />;
  if (section === 'security') return <SecurityView user={user} avatar={avatar} nav={nav} logout={logout} />;
  if (section === 'change-password') return <ChangePasswordView user={user} avatar={avatar} nav={nav} logout={logout} />;
  if (section === 'devices') return <DevicesView user={user} avatar={avatar} profileName={activeProfile?.name || profiles?.[0]?.name} nav={nav} logout={logout} />;
  if (section === 'profiles' || section === 'profile-settings') return <AccountProfilesView profiles={profiles || []} activeProfile={activeProfile} avatar={avatar} nav={nav} loadMe={loadMe} selectProfile={selectProfile} profileId={profileId} initialDialog={params.get('dialog')} />;

  return (
    <div className="nx-account-page">
      <AccountHeader avatar={avatar} nav={nav} logout={logout} />

      <div className="nx-account-shell">
        <aside className="nx-account-sidebar" aria-label="Account sections">
          <button className="nx-security-back" type="button" onClick={() => nav('/browse')}><IconChevronLeft size={14} /> Back to Netflix</button>
          <button className={section === 'overview' ? 'is-current' : ''} type="button" onClick={() => nav('/account')}><IconInfo size={17} /> Overview</button>
          <button className={section === 'membership' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=membership')}><IconCheck size={17} /> Membership</button>
          <button className={section === 'security' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=security')}><IconShieldCheckLine size={17} /> Security</button>
          <button className={section === 'devices' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=devices')}><IconDevicesLine size={17} /> Devices</button>
          <button className={section === 'profiles' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=profiles')}><IconUsers size={17} /> Profiles</button>
        </aside>

        <main className="nx-account-content">
          {section === 'membership' ? <MembershipView user={user} latestPayment={latestPayment} payments={payments} nav={nav} formatDate={formatDate} formatAmount={formatAmount} /> : <>
          <h1 className="nx-account-page-title">Account</h1>
          <p className="nx-account-page-subtitle">Membership Details</p>

          <section className="nx-account-card nx-membership-card" id="membership">
            <div className="nx-membership-ribbon">Member since {formatDate(user?.createdAt).replace(/\d{4}$/, (year) => year)}</div>
            <div className="nx-membership-main">
              <div>
                <h2>{planName}</h2>
                <p>Next payment: {nextPayment ? formatDate(nextPayment) : 'Not scheduled'}</p>
                <p className="nx-account-email"><span className="nx-card-mark" /> {latestPayment?.cardLast4 ? `•••• •••• •••• ${latestPayment.cardLast4}` : user?.email}</p>
              </div>
              <span className={`nx-membership-status ${user?.membershipActive ? 'paid' : ''}`}>{user?.membershipActive ? 'Active' : 'Pending'}</span>
            </div>
            <button type="button" className="nx-account-card-action" onClick={() => nav('/signup?resume=plan-intro')}>Manage membership <IconChevronRight size={17} /></button>
          </section>

          <h2 className="nx-account-section-title">Quick Links</h2>
          <section className="nx-account-card nx-account-links" id="devices">
            <AccountRow icon={<IconCheck size={17} />} title="Change plan" description={`Current plan: ${planName}`} onClick={() => nav('/signup?resume=plan-intro')} />
            <AccountRow icon={<IconAudio size={17} />} title="Manage payment method" description={latestPayment ? `${latestPayment.cardBrand || 'Card'} ending in ${latestPayment.cardLast4}` : 'No payment method on file'} onClick={() => document.getElementById('payments')?.scrollIntoView({ behavior: 'smooth' })} />
            <AccountRow icon={<IconUsers size={17} />} title="Manage profiles" description={`${profiles?.length || 0} profile${profiles?.length === 1 ? '' : 's'}`} onClick={() => nav('/account?section=profiles')} />
            <AccountRow icon={<IconDevicesLine size={17} />} title="Manage access and devices" description="Review your profiles and viewing access" onClick={() => nav('/account?section=devices')} />
            <AccountRow icon={<IconSettings size={17} />} title="Update password" description={user?.email} onClick={() => nav('/login/help')} />
            <AccountRow icon={<IconUsers size={17} />} title="Transfer a profile" description="Move a profile to a new membership" onClick={() => nav('/profiles')} />
            <AccountRow icon={<IconCheck size={17} />} title="Adjust parental controls" description="Manage kids profiles and content limits" onClick={() => settingsProfileId && nav(`/account?section=profile-settings&profileId=${settingsProfileId}&dialog=parental`)} />
            <AccountRow icon={<IconSettings size={17} />} title="Edit settings" description="Language, subtitles, autoplay, notifications, privacy and more" onClick={() => settingsProfileId && nav(`/account?section=profile-settings&profileId=${settingsProfileId}`)} />
          </section>

          <button type="button" className="nx-account-card nx-account-profile-card" onClick={() => nav('/account?section=profiles')}>
            <span><strong>Manage profiles</strong><small>{profiles?.length || 0} profiles</small></span>
            <span className="nx-account-avatar-stack">{(profiles || []).slice(0, 5).map((profile) => <img key={profile._id} src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />)}</span>
            <IconChevronRight size={17} />
          </button>

          <section className="nx-account-card nx-account-payments" id="payments">
            <div className="nx-account-card-heading"><div><h2>Payment history</h2><p>Only your masked payment details are shown.</p></div><span>{payments.length} record{payments.length === 1 ? '' : 's'}</span></div>
            {paymentError && <p className="nx-account-muted">{paymentError}</p>}
            {!paymentError && payments.length === 0 && <p className="nx-account-muted">No payments recorded yet.</p>}
            {payments.map((payment) => <div className="nx-payment-row" key={payment._id}><span>{formatDate(payment.createdAt)}</span><b>{formatAmount(payment)}</b><span>{payment.cardBrand || payment.method} {payment.cardLast4 ? `•••• ${payment.cardLast4}` : ''}</span><strong className={payment.status === 'paid' ? 'paid' : ''}>{payment.status}</strong></div>)}
          </section>

          <section className="nx-account-card nx-account-security" id="security">
            <h2>Account details</h2>
            <p><b>Email</b><span>{user?.email}</span></p>
            <p><b>Phone</b><span>{user?.phone || 'Not added'}</span></p>
            <p><b>Email verification</b><span>{user?.isEmailVerified ? 'Verified' : 'Not verified'}</span></p>
            <button type="button" className="nx-account-signout" onClick={async () => { await logout(); nav('/logout'); }}>Sign out</button>
          </section>
          </>}
        </main>
      </div>
    </div>
  );
}
