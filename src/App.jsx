import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import TmdbExplore from './pages/TmdbExplore';
import MailPage from './pages/MailPage';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FinishSignup from './pages/FinishSignup';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import FindAccount from './pages/FindAccount';
import Logout from './pages/Logout';
import Profiles from './pages/Profiles';
import Browse from './pages/Browse';
import BrowseBy from './pages/BrowseBy';
import Kids from './pages/Kids';
import NewPopular from './pages/NewPopular';
import TitleDetail from './pages/TitleDetail';
import Watch from './pages/Watch';
import SearchPage from './pages/SearchPage';
import MyList from './pages/MyList';
import History from './pages/History';
import Account from './pages/Account';
import StaticPage from './pages/StaticPage';
import ContactUs from './pages/ContactUs';
import TitleRequest from './pages/TitleRequest';
import HelpCenter from './pages/HelpCenter';
import OnlyOnNetflix from './pages/OnlyOnNetflix';
import OnlyOnNetflixTitle from './pages/OnlyOnNetflixTitle';
import MediaCenterSearch from './pages/MediaCenterSearch';
import InvestorRelations from './pages/InvestorRelations';
import MediaCenter from './pages/MediaCenter';
import MediaCenterTitle from './pages/MediaCenterTitle';
import SpeedTestPage from './pages/SpeedTestPage';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import MobileTitleSheet from './components/MobileTitleSheet';
import SocialSidebar from './components/SocialSidebar';
import SplashScreen from './components/SplashScreen';
import CookiePreferencesModal from './components/CookiePreferencesModal';
import PageLoadingSkeleton from './components/PageLoadingSkeleton';
import { applyLanguageToDocument, getLanguage } from './utils/footerLinks';

function Protected({ children, requireProfile = true, allowOnboarding = false }) {
  const { user, activeProfile, loading } = useAuth();
  if (loading) return <PageLoadingSkeleton variant="home" rowCount={2} />;
  if (!user) return <Navigate to="/login" replace />;
  // Signed in but hasn't paid yet → must finish signup before watching (Netflix)
  if (!user.membershipActive) return <Navigate to="/" replace />;
  // Paid but hasn't finished the step-by-step setup → back to the setup flow
  if (!allowOnboarding && !user.onboardingDone) return <Navigate to="/onboarding" replace />;
  if (requireProfile && !activeProfile) return <Navigate to="/profiles" replace />;
  return children;
}

// "/" — anonymous visitors get the landing page; users who left signup midway
// get Netflix's "Finish Sign-Up" page; members mid-setup go to the step-by-step
// screens; paid members who finished setup go straight to /browse.
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoadingSkeleton variant="home" rowCount={2} />;
  if (!user) return <Landing />;
  if (!user.membershipActive) return <FinishSignup />;
  return user.onboardingDone ? <Navigate to="/browse" replace /> : <Navigate to="/onboarding" replace />;
}

// "Explore All" links from the home rails (/browse/tmdb-*) open the filterable
// TMDB catalogue; genre slugs keep the local catalogue grid in BrowseBy.
function BrowseRoute() {
  const { filter } = useParams();
  return filter?.startsWith('tmdb-') ? <TmdbExplore presetKey={filter} /> : <BrowseBy />;
}

function TmdbWatchRoute() {
  const { tmdbId } = useParams();
  return <Watch tmdbId={tmdbId} />;
}

export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    applyLanguageToDocument(getLanguage());
    const onLanguageChange = (event) => applyLanguageToDocument(event.detail);
    const onStorage = (event) => {
      if (event.key === 'sf_language') applyLanguageToDocument(event.newValue || 'English');
    };
    window.addEventListener('sf-language-changed', onLanguageChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('sf-language-changed', onLanguageChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Where the red "Create Your Account" button in the REAL sign-up email
            lands. The link is verified, the passwordless account is created and
            the member carries on to the plan steps — the email itself is never
            re-drawn in the app; it stays in the member's own inbox. */}
        <Route path="/finish-signup" element={<MailPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login/help" element={<ForgotPassword />} />
        <Route path="/login/help/find-account" element={<FindAccount />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/profiles" element={<Protected requireProfile={false}><Profiles /></Protected>} />
        <Route path="/onboarding" element={<Protected requireProfile={false} allowOnboarding><Onboarding /></Protected>} />
        <Route path="/browse" element={<Protected><Browse /></Protected>} />
        {/* The navbar "New & Popular" button. It is a real page (hero + themed
            rails), not the genre filter grid BrowseBy falls back to — a static
            segment always outranks the :filter param below, so "new" never
            reaches BrowseRoute. */}
        <Route path="/browse/new" element={<Protected><NewPopular /></Protected>} />
        <Route path="/browse/:filter" element={<Protected><BrowseRoute /></Protected>} />
        {/* The navbar KIDS button. It is a page, not a profile switch: any member
            can browse the kid catalogue without changing their active profile. */}
        <Route path="/kids" element={<Protected><Kids /></Protected>} />
        <Route path="/title/:slug" element={<Protected><TitleDetail /></Protected>} />
        <Route path="/watch/tmdb/:tmdbId" element={<Protected><TmdbWatchRoute /></Protected>} />
        <Route path="/watch/:id" element={<Protected><Watch /></Protected>} />
        <Route path="/search" element={<Protected><SearchPage /></Protected>} />
        <Route path="/my-list" element={<Protected><MyList /></Protected>} />
        <Route path="/history" element={<Protected><History /></Protected>} />
        <Route path="/account" element={<Protected requireProfile={false}><Account /></Protected>} />
        <Route path="/p/speed-test" element={<SpeedTestPage />} />
        {/* The footer's "Investor Relations" link goes to the real
            ir.netflix.net layout (logo lockup + 8-item dropdown nav), not the
            generic prose page. Declared before /p/:slug so the static segment
            wins the match. */}
        <Route path="/p/investor-relations" element={<InvestorRelations />} />
        {/* The footer's "Contact Us" link and the "Request TV shows or movies"
            quick link both land on real forms, not on the generic prose page, so
            each is declared before /p/:slug and the static segment wins. */}
        <Route path="/p/contact" element={<ContactUs />} />
        <Route path="/p/title-request" element={<TitleRequest />} />
        {/* The Help Center landing page is the one Help Center screen that is
            not an article: it is a search field, five topic cards and the Quick
            Links list, on the light theme. It is its own component for the same
            reason Contact Us is — StaticPage renders markdown, and this is not
            markdown. Declared before /p/:slug so the static segment wins. */}
        <Route path="/p/help-center" element={<HelpCenter />} />
        {/* The footer's "Only on Netflix" button. On the real site that link
            opens a full public MARKETING page — hero, seventeen title rails, the
            plan grid and the closing banner — not a prose article, so it gets
            its own component and is declared before /p/:slug. It is
            deliberately NOT wrapped in <Protected>: the footer prints the link
            on the landing page, where nobody is signed in yet. */}
        <Route path="/p/only-on-netflix" element={<OnlyOnNetflix />} />
        {/* The screen every card on that page opens: the title's own public
            detail page, laid out like netflix.com/pk/title/<id>. It is public
            for exactly the same reason the page above it is — the card lives on
            a marketing page nobody has to sign in for. Declared before
            /p/:slug, and its extra ":type/:id" segments could never have matched
            /p/only-on-netflix in the first place. */}
        <Route path="/p/only-on-netflix/title/:type/:id" element={<OnlyOnNetflixTitle />} />
        {/* The footer's "Media Center" button. On the real site that link opens
            media.netflix.com — a full PUBLIC press site with its own masthead,
            title grid, news band and footer — not a prose article, so it gets
            its own component and is declared before /p/:slug. Like Only on
            Netflix it is deliberately NOT wrapped in <Protected>: the footer
            prints the link on the landing page, where nobody is signed in yet. */}
        <Route path="/p/media-center" element={<MediaCenter />} />
        {/* The screen a card on the Media Center opens: the title's own press
            detail page, laid out like media.netflix.com/en/only-on-netflix/<id>.
            Public for the same reason the grid page is. Declared before
            /p/:slug, whose single segment could never match this path anyway. */}
        <Route path="/p/media-center/title/:id" element={<MediaCenterTitle />} />
        {/* Where BOTH search boxes on the Media Center go. The reference keeps the
            term in the query string (/en/search?term=…), so a result set is
            linkable and Back walks the history of searches — it is its own page,
            not a filter state on the grid. Declared before /p/:slug. */}
        <Route path="/p/media-center/search" element={<MediaCenterSearch />} />
        <Route path="/p/:slug" element={<StaticPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SplashScreen />
      <SocialSidebar />
      <MobileNav />
      {/* The phone title sheet, mounted once for the whole app: any card on any
          page can raise it through the streamflix-mobile-title-open event, so
          every page keeps the same single overlay instead of owning a copy.
          It renders nothing off the phone. */}
      <MobileTitleSheet />
      {/* The footer's "Cookie Preferences" link opens a dialog, not a page, so the
          preference center is mounted once here and raised from whichever footer
          was clicked. */}
      <CookiePreferencesModal />
    </>
  );
}
