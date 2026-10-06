import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/core.css';
import './styles/components.css';
import './styles/cards.css';
import './styles/hover.css';
import './styles/player.css';
import './styles/pages.css';
import './styles/grid.css';
// The "Only on Netflix" marketing page. Self-contained and scoped entirely to
// .oon-*, so it cannot restyle any other page.
import './styles/onlyOnNetflix.css';
// The title screen a card on that page opens. Its own file because it is its
// own surface: every rule is scoped to .ont-*, and it reuses the .oon-* tokens
// (and the plans/banner/footer blocks) rather than restating them.
import './styles/oonTitle.css';
// The Media Center (media.netflix.com/en). Also self-contained — every rule is
// scoped to .mc-page / .mc-*, so it cannot restyle any other page.
import './styles/mediaCenter.css';
// The title screen a card on the Media Center opens (media.netflix.com's press
// detail page for one title). Self-contained and scoped entirely to .mct-*, so
// it cannot restyle any other page; it reuses the shared .mc-* chrome.
import './styles/mediaCenterTitle.css';
import './styles/mediaCenterSearch.css';
import './styles/responsive.css';
// The phone layer, imported LAST so it wins over responsive.css at equal
// specificity. Everything in it is behind a max-width media query, so the
// desktop build is byte-for-byte unchanged.
import './styles/mobile.css';
// Landing / sign in / sign up phone flows. Separate because these pages are the
// first thing a phone user sees and they needed a different set of overrides
// than the browse rails and the title sheet.
import './styles/mobileAuth.css';
import './styles/splash.css';
import './styles/systemError.css';
import './styles/accountSecurity.css';
// The "Privacy Preference Center" dialog the footer's Cookie Preferences link
// raises. Kept in its own file because it is a white, self-contained surface
// that must not inherit any of the dark page styling above.
import './styles/cookieModal.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Without this a render throw unmounts the whole app and the user just gets a
        blank white page with no clue what happened. */}
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
