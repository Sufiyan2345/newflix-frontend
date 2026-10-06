export default function PageLoadingSkeleton({ variant = 'rows', rowCount = 3, cardCount = 6 }) {
  if (variant === 'home') {
    return (
      <main className="browse-skeleton" role="status" aria-label="Loading Newflix">
        <span className="browse-skeleton-sr">Loading movies and series…</span>
        <div className="browse-skeleton-hero">
          <div className="browse-skeleton-copy">
            <span className="browse-skeleton-block browse-skeleton-brand" />
            <span className="browse-skeleton-block browse-skeleton-title" />
            <span className="browse-skeleton-block browse-skeleton-meta" />
            <span className="browse-skeleton-block browse-skeleton-description" />
            <span className="browse-skeleton-block browse-skeleton-description short" />
            <div className="browse-skeleton-buttons">
              <span className="browse-skeleton-block" />
              <span className="browse-skeleton-block" />
            </div>
          </div>
        </div>
        <div className="browse-skeleton-rows">
          {Array.from({ length: rowCount }, (_, row) => (
            <section className="browse-skeleton-row" key={row} aria-hidden="true">
              <span className="browse-skeleton-block browse-skeleton-row-title" />
              <div className="browse-skeleton-cards">
                {Array.from({ length: cardCount }, (_, card) => (
                  <div className="browse-skeleton-card" key={card}>
                    <span className="browse-skeleton-block browse-skeleton-art" />
                    <span className="browse-skeleton-block browse-skeleton-caption" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="browse-skeleton-grid" role="status" aria-label="Loading titles">
        <span className="browse-skeleton-sr">Loading titles…</span>
        {Array.from({ length: cardCount * 2 }, (_, index) => (
          <div className="browse-skeleton-card" key={index}>
            <span className="browse-skeleton-block browse-skeleton-art" />
            <span className="browse-skeleton-block browse-skeleton-caption" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="browse-skeleton-rows" role="status" aria-label="Loading titles">
      <span className="browse-skeleton-sr">Loading movies and series…</span>
      {Array.from({ length: rowCount }, (_, row) => (
        <section className="browse-skeleton-row" key={row} aria-hidden="true">
          <span className="browse-skeleton-block browse-skeleton-row-title" />
          <div className="browse-skeleton-cards">
            {Array.from({ length: cardCount }, (_, card) => (
              <div className="browse-skeleton-card" key={card}>
                <span className="browse-skeleton-block browse-skeleton-art" />
                <span className="browse-skeleton-block browse-skeleton-caption" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
