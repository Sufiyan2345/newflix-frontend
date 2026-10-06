import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCenterHeader, LegalFooter } from '../components/HelpCenterChrome';

// The Help Center's Contact Us page - help.netflix.com/en/contactus.
//
// It is NOT a markdown article: the reference draws a single 720px column with
// an "issue description" field and a five-row Quick Links list, then closes on
// the legal footer (no "Need more help?" bar - the bar is on the article pages,
// including the title request form this page links to).
//
// Every value in the markup and in pages.css was read off the live render at
// 1280px rather than estimated, so the page sits on the same y values as the
// reference: title 98, field 215, Quick Links 295, rows on 49px each.

// The five rows, in the reference's order. Each carries the reference's own
// 16x16 glyph - the paths below are copied from the live page, not redrawn.
//
// The first four point at netflix.com account pages on the live site. This app
// has a real screen for each of them, so they route here instead, the same way
// footerLinks.js already sends "Account" to /account rather than to a static page.
const QUICK_LINKS = [
  {
    label: 'Reset password',
    to: '/forgot-password',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M17 10V7A5 5 0 007 7v3H5v12h14V10zM9 7a3 3 0 016 0v3H9zm8 13H7v-8h10z" />
        <path d="M11 14h2v4h-2z" />
      </svg>
    ),
  },
  {
    label: 'Update email',
    to: '/account',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.75 2C0.335786 2 0 2.33579 0 2.75V12.25C0 13.2165 0.783501 14 1.75 14H14.25C15.2165 14 16 13.2165 16 12.25V2.75C16 2.33579 15.6642 2 15.25 2H0.75ZM8 8.00978L2.76865 3.5H13.2313L8 8.00978ZM8.4897 9.56806L14.5 4.38677V12.25C14.5 12.3881 14.3881 12.5 14.25 12.5H1.75C1.61193 12.5 1.5 12.3881 1.5 12.25V4.38677L7.5103 9.56806L8 9.99022L8.4897 9.56806Z"
        />
      </svg>
    ),
  },
  {
    label: 'Get help signing in',
    to: '/p/sign-in-help',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" d="M0 0h24v24H0z" />
        <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" />
        <path d="M11.89 14.72a1.47 1.47 0 101 .43 1.39 1.39 0 00-1-.43zM14.09 7a4.58 4.58 0 00-1.91-.38 4.6 4.6 0 00-2 .42 3.52 3.52 0 00-2 2.73h2.31A1.21 1.21 0 0111 9a1.81 1.81 0 011-.25 1.69 1.69 0 011 .28.82.82 0 01.38.67 1 1 0 01-.24.62 4.36 4.36 0 001.24 3.27A3.27 3.27 0 0011 12.16a2.94 2.94 0 00-.31 1.43v.31h2.27v-.19a1.25 1.25 0 01.22-.68 2.83 2.83 0 01.92-.75 4.36 4.36 0 001.35-1.14 2.31 2.31 0 00.46-1.45 2.83 2.83 0 00-.47-1.62A3.19 3.19 0 0014.09 7z" />
      </svg>
    ),
  },
  {
    label: 'Update payment method',
    to: '/p/billing-and-payments',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM4 6h16v2H4zm0 12v-8h16v8z" />
        <path d="M15 14h3v2h-3z" />
      </svg>
    ),
  },
  {
    // The one row that stays inside the Help Center, and the reason this page is
    // its own component: it opens the title request form.
    label: 'Request TV shows or movies',
    to: '/p/title-request',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 3.5v1.197L4 8.254V7.5H2v8h2v-.754l1 .223V18.5c0 .459.313.858.757.971l4 1a1 1 0 001.042-.371l2.471-3.293L20 18.301V19.5h2v-16h-2zM9.598 18.369L7 17.719v-2.307l4.127.918-1.529 2.039zM4 12.697v-2.394l16-3.557v9.508L4 12.697z" />
      </svg>
    ),
  },
];

export default function ContactUs() {
  const [issue, setIssue] = useState('');
  const [sent, setSent] = useState(false);

  // The reference POSTs to /contactus/start and swaps the field for a guided
  // support flow. There is no helpdesk behind this clone, so submitting records
  // the description locally and confirms it, which keeps the row keyboard- and
  // mouse-usable instead of a control that goes nowhere.
  const onSubmit = (e) => {
    e.preventDefault();
    if (!issue.trim()) return;
    setSent(true);
  };

  return (
    // hc-form-page is the shared flag for the two Help Center FORMS: it scopes
    // the masthead to the 720px column and lets the footer grow into any
    // leftover window height, so the black runs to the bottom edge the way it
    // does on the reference instead of stopping short of it.
    <div className="static-page hc-page ci-page hc-form-page">
      <HelpCenterHeader />
      <main className="ci-shell">
        <h1 className="ci-title">Contact us</h1>

        <div className="contactus-container">
          <div className="contactus-form ci-section">
            <h3 className="contactus-input-label">
              Tell us more and we&rsquo;ll find the best solution for you
            </h3>
            <form className="contactus-issue-form" onSubmit={onSubmit}>
              <div className="issue-description-field">
                <label className="sr-only" htmlFor="ci-issue">Describe your issue</label>
                <input
                  id="ci-issue"
                  name="issueDescription"
                  className="form-control form-control-sm"
                  type="text"
                  placeholder="Describe your issue"
                  value={issue}
                  maxLength={200}
                  autoComplete="off"
                  onChange={(e) => { setIssue(e.target.value); setSent(false); }}
                />
                {/* The reference keeps the arrow hidden until the field takes
                    focus (.issue-description-field svg{visibility:hidden},
                    input:focus+button svg{visibility:visible}) and the button
                    itself disabled until there is something to send. */}
                <button
                  type="submit"
                  disabled={!issue.trim()}
                  className="h-btn btn-text submit-issue-description"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true" focusable="false">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M13.0841 1.66201L16.482 5.05871H0V6.93371H16.4832L13.0839 10.3344L14.4099 11.66L19.409 6.659C19.5847 6.48315 19.6835 6.24468 19.6835 5.99604C19.6834 5.7474 19.5846 5.50895 19.4088 5.33317L14.4096 0.335938L13.0841 1.66201Z"
                    />
                  </svg>
                  <span className="sr-only">Send</span>
                </button>
              </div>
            </form>
            {sent && (
              <p className="ci-issue-reply" role="status">
                Thanks &mdash; we&rsquo;ve got your message and someone will be in touch.
              </p>
            )}
          </div>
        </div>

        <div className="quick-links">
          <h3 className="quick-links-title">Quick Links</h3>
          <ol className="quick-links-list">
            {QUICK_LINKS.map((q) => (
              <li className="quick-link" key={q.label}>
                {q.icon}
                <Link to={q.to}>{q.label}</Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}

