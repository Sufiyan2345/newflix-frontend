// TEMPORARY smoke test — deleted after use.
// Renders the public title page to a string. Its whole purpose is to catch the
// class of bug esbuild cannot: a free identifier that only explodes when React
// actually evaluates it (an undefined glyph/component), which otherwise reaches
// the user as a white "NSES-500" screen.
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './src/context/AuthContext';
import OnlyOnNetflixTitle from './src/pages/OnlyOnNetflixTitle';
import OnlyOnNetflix from './src/pages/OnlyOnNetflix';

const render = (path, pattern, element) => renderToString(
  <AuthProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={pattern} element={element} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>,
);

const cases = [
  ['/p/only-on-netflix/title/tv/81437051', '/p/only-on-netflix/title/:type/:id', <OnlyOnN etflixTitle />,
    ['oon-header', 'ont-pillnav', 'oon-hero', 'oon-plans', 'ont-join-row']],
  ['/p/only-on-netflix/title/movie/550', '/p/only-on-netflix/title/:type/:id', <OnlyOnNetflixTitle />,
    ['oon-header', 'ont-pillnav', 'oon-hero', 'oon-plans', 'ont-join-row']],
  ['/p/only-on-netflix', '/p/only-on-netflix', <OnlyOnNetflix />,
    ['oon-header', 'oon-hero', 'oon-plans', 'oon-banner']],
];

let failed = 0;
for (const [path, pattern, element, checks] of cases) {
  try {
    const html = render(path, pattern, element);
    const missing = checks.filter((c) => !html.includes(c));
    console.log(
      `RESULT OK  ${path}  html=${html.length} chars`,
      missing.length ? `| MISSING: ${missing.join(', ')}` : '| all key sections present',
    );
    if (missing.length) failed += 1;
  } catch (err) {
    failed += 1;
    console.log(`RESULT FAIL ${path}: ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);