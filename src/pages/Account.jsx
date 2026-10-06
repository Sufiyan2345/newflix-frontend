import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';
import { IconAudio, IconCaret, IconCheck, IconChevronLeft, IconChevronRight, IconCreditCardLine, IconDevicesLine, IconFlaskLine, IconHomeLine, IconInfo, IconLockLine, IconMailLine, IconPersonAccessLine, IconPhoneLine, IconSettings, IconShieldCheckLine, IconTransferLine, IconUsers, IconWarningTriangleLine } from '../components/Icons';

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
      <h1>Membership</h1>
      <p className="nx-membership-subtitle">Plan Details</p>
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
                <button type="button" onClick={() => nav('/profiles?settings=1')}>Manage profiles</button>
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
          <button type="button" onClick={() => nav('/account?section=overview#devices')}><IconDevicesLine size={16} /> Devices</button>
          <button type="button" onClick={() => nav('/profiles')}><IconUsers size={16} /> Profiles</button>
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
            <SecurityRow icon={<IconLockLine size={16} />} title="Password" onClick={() => nav('/login/help')} />
            <SecurityRow icon={<IconMailLine size={16} />} title="Email" detail={user?.email || 'Email address not available'} status={emailVerified ? 'Verified' : 'Needs verification'} onClick={() => {}} />
            <SecurityRow icon={<IconPhoneLine size={16} />} title="Mobile phone" detail={user?.phone || undefined} status={phoneVerified ? 'Verified' : 'Needs verification'} onClick={() => {}} />
          </section>

          <h2 className="nx-security-section-title">Access and privacy</h2>
          <section className="nx-security-card nx-security-access-card" aria-label="Access and privacy">
            <SecurityRow icon={<IconDevicesLine size={17} />} title="Access and devices" detail="Manage signed-in devices" onClick={() => nav('/account?section=overview#devices')} />
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

export default function Account() {
  const { user, profiles, logout } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const section = params.get('section') || 'overview';
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
  const avatar = profiles?.[0]?.avatarUrl || '/Netflix-avatar-1.png';

  if (section === 'extra-member') return <ExtraMemberView step={extraStep} user={user} nav={nav} logout={logout} />;
  if (section === 'manage-membership') return <ManageMembershipView user={user} nav={nav} logout={logout} />;
  if (section === 'security') return <SecurityView user={user} avatar={avatar} nav={nav} logout={logout} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />;

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
                <button type="button" onClick={() => nav('/profiles?settings=1')}>Manage profiles</button>
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
          <button type="button" onClick={() => document.getElementById('devices')?.scrollIntoView({ behavior: 'smooth' })}><IconAudio size={17} /> Devices</button>
          <button type="button" onClick={() => nav('/profiles')}><IconUsers size={17} /> Profiles</button>
        </aside>

        <main className="nx-account-content">
          {section === 'membership' ? <MembershipView user={user} latestPayment={latestPayment} payments={payments} nav={nav} formatDate={formatDate} formatAmount={formatAmount} /> : <>
          <h1>Membership Details</h1>

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
            <AccountRow icon={<IconUsers size={17} />} title="Manage profiles" description={`${profiles?.length || 0} profile${profiles?.length === 1 ? '' : 's'}`} onClick={() => nav('/profiles')} />
            <AccountRow icon={<IconInfo size={17} />} title="Manage access and devices" description="Review your profiles and viewing access" onClick={() => nav('/profiles')} />
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
