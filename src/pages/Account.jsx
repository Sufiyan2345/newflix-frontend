import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { IconAudio, IconCaret, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconCreditCardLine, IconDevicesLine, IconDownloadLine, IconFlaskLine, IconHomeLine, IconInfo, IconLockLine, IconMailLine, IconPersonAccessLine, IconPhoneLine, IconSettings, IconShieldCheckLine, IconTransferLine, IconTvLine, IconUsers, IconWarningTriangleLine } from '../components/Icons';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
  : 'Not available';

const formatAmount = (payment) => payment
  ? `${payment.currency || 'PKR'} ${Number(payment.amount || 0).toLocaleString()}`
  : 'No payment recorded';

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

function SecurityView({ user, avatar, nav, logout, profileMenuOpen, setProfileMenuOpen }) {
  const [featureTesting, setFeatureTesting] = useState(true);
  const phoneVerified = Boolean(user?.isPhoneVerified || user?.phoneVerified);
  const emailVerified = Boolean(user?.isEmailVerified);

  return (
    <div className="nx-account-page nx-security-page">
      <header className="nx-account-header nx-security-header">
        <div className="nx-security-topbar">
          <button type="button" className="nx-security-logo-button" onClick={() => nav('/browse')} aria-label="Netflix home">
            <img src="/newflix.png" alt="Netflix" className="nx-account-logo" />
          </button>
          <div className="nx-account-profile-wrap">
            <button type="button" className="nx-account-profile" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen} aria-label="Open profile menu">
              <img src={avatar} alt="Current profile" /><IconCaret size={11} />
            </button>
            {profileMenuOpen && (
              <div className="nx-account-profile-menu">
                <div className="nx-account-profile-menu-user"><img src={avatar} alt="" /><span>{user?.name || 'Profile'}<small>{user?.email}</small></span></div>
                <button type="button" onClick={() => nav('/account')}>Account</button>
                <button type="button" onClick={() => nav('/account?section=profiles')}>Manage profiles</button>
                <button type="button" onClick={() => nav('/profiles')}>Switch profile</button>
                <button type="button" className="is-danger" onClick={async () => { await logout(); nav('/logout'); }}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

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
      <header className="nx-account-header nx-security-header">
        <div className="nx-security-topbar">
          <button type="button" className="nx-security-logo-button" onClick={() => nav('/browse')} aria-label="Newflix home">
            <img src="/newflix.png" alt="Newflix" className="nx-account-logo" />
          </button>
          <button type="button" className="nx-account-profile" onClick={() => nav('/account?section=security')} aria-label="Back to Security">
            <img src={avatar} alt="Current profile" /><IconCaret size={11} />
          </button>
        </div>
      </header>
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

function DevicesView({ user, avatar, nav, logout, profileMenuOpen, setProfileMenuOpen }) {
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
          <header className="nx-account-header nx-security-header">
            <div className="nx-security-topbar">
              <button type="button" className="nx-security-logo-button" onClick={() => nav('/browse')} aria-label="Newflix home">
                <img src="/newflix.png" alt="Newflix" className="nx-account-logo" />
              </button>
              <div className="nx-account-profile-wrap">
                <button type="button" className="nx-account-profile" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen} aria-label="Open profile menu">
                  <img src={avatar} alt="Current profile" /><IconCaret size={11} />
                </button>
                {profileMenuOpen && (
                  <div className="nx-account-profile-menu">
                    <div className="nx-account-profile-menu-user"><img src={avatar} alt="" /><span>{user?.name || 'Profile'}<small>{user?.email}</small></span></div>
                    <button type="button" onClick={() => nav('/account')}>Account</button>
                    <button type="button" onClick={() => nav('/account?section=profiles')}>Manage profiles</button>
                    <button type="button" onClick={() => nav('/profiles')}>Switch profile</button>
                    <button type="button" className="is-danger" onClick={async () => { await logout(); nav('/logout'); }}>Sign out</button>
                  </div>
                )}
              </div>
            </div>
          </header>

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
                          <span className="nx-access-current-badge">CURRENT DEVICE</span>
                        </div>
                        <div className="nx-access-device-details">
                          <div className="nx-access-device-detail-row"><IconPersonAccessLine size={15} /><span>No profile activity to show</span></div>
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
                            <div className="nx-access-device-detail-row"><IconPersonAccessLine size={15} /><span>Selected during account setup</span></div>
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
  { value: 'ALL', label: 'All maturity ratings' },
  { value: '7+', label: '7+' },
  { value: '13+', label: '13+' },
  { value: '16+', label: '16+' },
  { value: '18+', label: '18+' },
];

const PROFILE_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
];

function ProfileAccountShell({ avatar, nav, section, children }) {
  return (
    <div className="nx-account-page nx-security-page nx-devices-page nx-profiles-account-page">
      <header className="nx-account-header nx-security-header">
        <div className="nx-security-topbar">
          <button type="button" className="nx-security-logo-button" onClick={() => nav('/browse')} aria-label="Newflix home">
            <img src="/newflix.png" alt="Newflix" className="nx-account-logo" />
          </button>
          <div className="nx-account-profile-wrap">
            <button type="button" className="nx-account-profile" aria-label="Current profile">
              <img src={avatar} alt="Current profile" /><IconCaret size={11} />
            </button>
          </div>
        </div>
      </header>
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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = profiles.find((profile) => profile._id === profileId);
  const goBack = () => nav('/account?section=profiles');

  const createProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.post('/user/profiles', { name: newName.trim(), isKidsProfile: false });
      await loadMe();
      setNewName('');
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
        <ProfileSettingsRow icon={<IconWarningTriangleLine size={19} />} title="Adjust parental controls" detail="Set maturity ratings, block titles" onClick={() => { if (profiles.length) nav(`/account?section=profile-settings&profileId=${profiles[0]._id}&dialog=parental`); }} />
        <ProfileSettingsRow icon={<IconTransferLine size={19} />} title="Transfer a profile" detail="Copy a profile to another account" onClick={() => nav('/profiles?settings=1')} />
      </section>

      <h2 className="nx-profiles-list-title">Profile Settings</h2>
      <section className="nx-security-card nx-profiles-list" aria-label="Profiles">
        {profiles.map((profile) => (
          <button type="button" className="nx-profiles-list-row" key={profile._id} onClick={() => nav(`/account?section=profile-settings&profileId=${profile._id}`)}>
            <span className="nx-profiles-avatar" style={{ backgroundColor: profile.avatarColor || '#e50914' }}>
              <img src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />
            </span>
            <strong>{profile.name}</strong>
            <span className="nx-profiles-you">{profile._id === activeProfile?._id ? 'Your Profile' : profile.isKidsProfile ? 'Kids Profile' : ''}</span>
            <IconChevronRight size={18} />
          </button>
        ))}
        {profiles.length < 5 && !adding && <button type="button" className="nx-profiles-add" onClick={() => { setError(''); setAdding(true); }}>Add Profile</button>}
        {adding && (
          <form className="nx-profiles-add-form" onSubmit={createProfile}>
            <label htmlFor="nx-account-new-profile">Profile name</label>
            <input id="nx-account-new-profile" value={newName} onChange={(event) => setNewName(event.target.value)} required maxLength={40} autoFocus />
            {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
            <div><button type="button" onClick={() => setAdding(false)}>Cancel</button><button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add Profile'}</button></div>
          </form>
        )}
        {error && !adding && <p className="nx-profile-form-error" role="alert">{error}</p>}
      </section>
    </ProfileAccountShell>
  );
}

function ProfilePreferencesView({ profile, activeProfile, avatar, nav, loadMe, selectProfile, goBack, initialDialog }) {
  const { user } = useAuth();
  const [dialog, setDialog] = useState(initialDialog || null);
  const [name, setName] = useState(profile.name);
  const [language, setLanguage] = useState(profile.language || 'en');
  const [maturity, setMaturity] = useState(profile.maturityLimit || '18+');
  const [autoplayNext, setAutoplayNext] = useState(profile.autoplayNext !== false);
  const [subtitleScale, setSubtitleScale] = useState(() => localStorage.getItem(`sf_subtitle_scale_${profile._id}`) || '100');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [lockStep, setLockStep] = useState('overview');
  const [lockAction, setLockAction] = useState('set');
  const [lockPassword, setLockPassword] = useState('');
  const [lockPasswordVisible, setLockPasswordVisible] = useState(false);
  const [lockCode, setLockCode] = useState('');
  const [lockPin, setLockPin] = useState('');
  const [lockTicket, setLockTicket] = useState('');
  const [lockError, setLockError] = useState('');
  const [lockNotice, setLockNotice] = useState('');
  const isYourProfile = profile._id === activeProfile?._id;
  const maskedEmail = user?.email?.replace(/^(.)([^@]*)(@.*)$/, (_match, first, rest, domain) => `${first}${'•'.repeat(Math.max(3, rest.length))}${domain}`) || 'your verified account email';

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

  const requestLockEmailCode = async () => {
    setBusy(true);
    setLockError('');
    setLockNotice('');
    try {
      await API.post(`/user/profiles/${profile._id}/lock/send-email`, { action: lockAction });
      setLockNotice(`Verification code sent to ${maskedEmail}.`);
      setLockCode('');
      setLockStep('otp');
    } catch (err) {
      setLockError(err.response?.data?.message || 'Could not send the verification code. Please try again.');
    } finally {
      setBusy(false);
    }
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

  const verifyLockEmailCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLockError('');
    try {
      const { data } = await API.post(`/user/profiles/${profile._id}/lock/verify-email`, { action: lockAction, otp: lockCode });
      setLockTicket(data.ticket);
      if (lockAction === 'delete') await finishProfileLockDelete(data.ticket);
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

  const confirmLockPassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setLockError('');
    try {
      const { data } = await API.post(`/user/profiles/${profile._id}/lock/confirm-password`, { action: lockAction, password: lockPassword });
      setLockTicket(data.ticket);
      setLockPassword('');
      if (lockAction === 'delete') await finishProfileLockDelete(data.ticket);
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
    setError('');
    setName(profile.name);
    setLanguage(profile.language || 'en');
    setMaturity(profile.maturityLimit || '18+');
    setAutoplayNext(profile.autoplayNext !== false);
    setDialog(key);
  };

  const savePreference = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (dialog === 'personal') await API.put(`/user/profiles/${profile._id}`, { name: name.trim() });
      if (dialog === 'language') await API.put(`/user/profiles/${profile._id}`, { language });
      if (dialog === 'parental') await API.put(`/user/profiles/${profile._id}`, { maturityLimit: maturity });
      if (dialog === 'playback') await API.put(`/user/profiles/${profile._id}`, { autoplayNext });
      if (dialog === 'subtitles') localStorage.setItem(`sf_subtitle_scale_${profile._id}`, subtitleScale);
      if (dialog !== 'subtitles') await loadMe();
      setDialog(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this preference. Please try again.');
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

  const openHistory = () => {
    if (profile.profileLockEnabled && !isYourProfile) {
      nav('/profiles');
      return;
    }
    selectProfile(profile);
    nav('/history');
  };

  const dialogTitle = {
    personal: 'Edit personal and contact info',
    language: 'Languages',
    parental: 'Adjust parental controls',
    playback: 'Playback settings',
    subtitles: 'Subtitle appearance',
  }[dialog];

  return (
    <div className="nx-account-page nx-security-page nx-profile-detail-page">
      <header className="nx-account-header nx-security-header">
        <div className="nx-security-topbar">
          <button type="button" className="nx-security-logo-button" onClick={() => nav('/browse')} aria-label="Newflix home">
            <img src="/newflix.png" alt="Newflix" className="nx-account-logo" />
          </button>
          <button type="button" className="nx-account-profile" onClick={() => nav('/account?section=profiles')} aria-label="Back to profiles">
            <img src={avatar} alt="Current profile" /><IconCaret size={11} />
          </button>
        </div>
      </header>
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
                <ProfileSettingsRow icon={<IconUsers size={18} />} title={profile.name} detail="Edit personal and contact info" onClick={() => openDialog('personal')} />
                <ProfileSettingsRow icon={<IconLockLine size={18} />} title="Profile Lock" detail={profile.profileLockEnabled ? 'Profile Lock is on' : 'Require a PIN to access this profile'} onClick={() => { setLockStep('overview'); setDialog('lock'); setLockError(''); }} />
              </section>
              <h2 className="nx-profile-preferences-title">Preferences</h2>
              <section className="nx-security-card nx-profile-preferences-card" aria-label="Preferences">
                <ProfileSettingsRow icon={<IconAudio size={18} />} title="Languages" detail={`Set languages for display and audio · ${PROFILE_LANGUAGES.find((item) => item.value === (profile.language || 'en'))?.label || 'English'}`} onClick={() => openDialog('language')} />
                <ProfileSettingsRow icon={<IconWarningTriangleLine size={18} />} title="Adjust Parental Controls" detail="Edit maturity rating and title restrictions" onClick={() => openDialog('parental')} />
                <ProfileSettingsRow icon={<IconSettings size={18} />} title="Subtitle appearance" detail="Customize the way subtitles appear" onClick={() => openDialog('subtitles')} />
                <ProfileSettingsRow icon={<IconCheck size={18} />} title="Playback settings" detail="Set autoplay and video quality" onClick={() => openDialog('playback')} />
                <ProfileSettingsRow icon={<IconInfo size={18} />} title="Viewing activity" detail="Manage viewing history and ratings" onClick={openHistory} />
                <ProfileSettingsRow icon={<IconShieldCheckLine size={18} />} title="Privacy and data settings" detail="Manage use of personal info" onClick={() => nav('/p/privacy')} />
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

      {dialog && dialog !== 'lock' && (
        <div className="nx-profile-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDialog(null); }}>
          <form className="nx-profile-dialog" onSubmit={savePreference} aria-labelledby="nx-profile-dialog-title">
            <button type="button" className="nx-profile-dialog-close" onClick={() => setDialog(null)} disabled={busy} aria-label="Close">×</button>
            <h2 id="nx-profile-dialog-title">{dialogTitle}</h2>
            {dialog === 'personal' && <label>Profile name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required autoFocus /></label>}
            {dialog === 'language' && <label>Display and audio language<select value={language} onChange={(event) => setLanguage(event.target.value)}>{PROFILE_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
            {dialog === 'parental' && <label>Allowed maturity rating<select value={maturity} onChange={(event) => setMaturity(event.target.value)}>{PROFILE_MATURITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small>Titles above this rating will be restricted for this profile.</small></label>}
            {dialog === 'playback' && <label className="nx-profile-dialog-check"><input type="checkbox" checked={autoplayNext} onChange={(event) => setAutoplayNext(event.target.checked)} /> Autoplay next episode in a series on all devices</label>}
            {dialog === 'subtitles' && <label>Subtitle text size<select value={subtitleScale} onChange={(event) => setSubtitleScale(event.target.value)}><option value="75">Small</option><option value="100">Medium</option><option value="125">Large</option></select><small>This display preference is saved for this profile on this device.</small></label>}
            {error && <p className="nx-profile-form-error" role="alert">{error}</p>}
            {dialog !== 'lock' && <div className="nx-profile-dialog-actions"><button type="button" onClick={() => setDialog(null)} disabled={busy}>Cancel</button><button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>}
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  if (section === 'extra-member') return <ExtraMemberView step={extraStep} user={user} nav={nav} logout={logout} />;
  if (section === 'manage-membership') return <ManageMembershipView user={user} nav={nav} logout={logout} />;
  if (section === 'security') return <SecurityView user={user} avatar={avatar} nav={nav} logout={logout} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />;
  if (section === 'change-password') return <ChangePasswordView user={user} avatar={avatar} nav={nav} logout={logout} />;
  if (section === 'devices') return <DevicesView user={user} avatar={avatar} nav={nav} logout={logout} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />;
  if (section === 'profiles' || section === 'profile-settings') return <AccountProfilesView profiles={profiles || []} activeProfile={activeProfile} avatar={avatar} nav={nav} loadMe={loadMe} selectProfile={selectProfile} profileId={profileId} initialDialog={params.get('dialog')} />;

  return (
    <div className="nx-account-page">
      <header className="nx-account-header">
        <div className="nx-account-topbar">
          <img src="/newflix.png" alt="Netflix" className="nx-account-logo" />
          <div className="nx-account-profile-wrap">
            <button type="button" className="nx-account-profile" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen} aria-label="Open profile menu">
              <img src={avatar} alt="Current profile" /><IconCaret size={11} />
            </button>
            {profileMenuOpen && (
              <div className="nx-account-profile-menu">
                <div className="nx-account-profile-menu-user"><img src={avatar} alt="" /><span>{user?.name || 'Profile'}<small>{user?.email}</small></span></div>
                <button type="button" onClick={() => nav('/account')}>Account</button>
                <button type="button" onClick={() => nav('/account?section=profiles')}>Manage profiles</button>
                <button type="button" onClick={() => nav('/profiles')}>Switch profile</button>
                <button type="button" className="is-danger" onClick={async () => { await logout(); nav('/logout'); }}>Sign out</button>
              </div>
            )}
          </div>
        </div>
        <div className="nx-account-subbar">
          <button type="button" className="nx-account-back" onClick={() => nav('/browse')}><IconChevronLeft size={14} /> <span>Back to Netflix</span></button>
          <h1>{section === 'membership' ? 'Membership' : 'Account'}</h1>
          <span aria-hidden="true" />
        </div>
      </header>

      <div className="nx-account-shell">
        <aside className="nx-account-sidebar" aria-label="Account sections">
          <button className={section === 'overview' ? 'is-current' : ''} type="button" onClick={() => nav('/account')}><IconInfo size={17} /> Overview</button>
          <button className={section === 'membership' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=membership')}><IconCheck size={17} /> Membership</button>
          <button className={section === 'security' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=security')}><IconShieldCheckLine size={17} /> Security</button>
          <button className={section === 'devices' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=devices')}><IconDevicesLine size={17} /> Devices</button>
          <button className={section === 'profiles' ? 'is-current' : ''} type="button" onClick={() => nav('/account?section=profiles')}><IconUsers size={17} /> Profiles</button>
        </aside>

        <main className="nx-account-content">
          {section === 'membership' ? <MembershipView user={user} latestPayment={latestPayment} payments={payments} nav={nav} formatDate={formatDate} formatAmount={formatAmount} /> : <>
          <h1 className="nx-account-page-title">Membership Details</h1>

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
            <AccountRow icon={<IconCheck size={17} />} title="Adjust parental controls" description="Manage kids profiles and content limits" onClick={() => nav('/profiles')} />
            <AccountRow icon={<IconSettings size={17} />} title="Edit settings" description="Language, subtitles, autoplay, notifications, privacy and more" onClick={() => nav('/account')} />
          </section>

          <section className="nx-account-card nx-account-profile-card" onClick={() => nav('/profiles?settings=1')}>
            <span><strong>Manage profiles</strong><small>{profiles?.length || 0} profiles</small></span>
            <span className="nx-account-avatar-stack">{(profiles || []).slice(0, 5).map((profile) => <img key={profile._id} src={profile.avatarUrl || '/Netflix-avatar-1.png'} alt="" />)}</span>
            <IconChevronRight size={17} />
          </section>

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
