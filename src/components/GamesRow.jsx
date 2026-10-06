import { useEffect, useRef, useState } from 'react';

const GAMES = [
  { id: '81680940', title: 'Cozy Grove: Camp Spirit', image: '/games/pexels-7915438.jpg', position: 'center 43%' },
  { id: '81621577', title: 'Country Friends', image: '/games/pexels-7862609.jpg', position: 'center 48%' },
  { id: '81616381', title: 'SpongeBob: Get Cooking', image: '/games/pexels-442576.jpg', position: 'center 44%' },
  { id: '81554162', title: 'Spiritfarer', image: '/games/pexels-7915439.jpg', position: 'center 56%' },
  { id: '81763213', title: 'The Ultimatum: Choices', image: '/games/pexels-7915437.jpg', position: 'center 40%' },
  { id: '81605827', title: 'Netflix Stories', image: '/games/pexels-7862620.jpg', position: 'center 43%' },
  { id: '81738613', title: 'Money Heist: Ultimate Choice', image: '/games/gaming-photo-test.jpg', position: 'center 46%' },
  { id: '81685715', title: 'Too Hot to Handle 2', image: '/games/pexels-7862610.jpg', position: 'center 42%' },
];

export default function GamesRow() {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const updateArrows = () => {
      setCanScrollLeft(rail.scrollLeft > 1);
      setCanScrollRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
    };

    updateArrows();
    rail.addEventListener('scroll', updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(rail);
    return () => {
      rail.removeEventListener('scroll', updateArrows);
      observer.disconnect();
    };
  }, []);

  const scroll = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="games-row" aria-label="Games">
      <div className="games-row-header">
        <h2 className="games-row-title">Games <span>BETA</span></h2>
      </div>
      <button
        type="button"
        className="games-row-arrow left"
        aria-label="Previous games"
        disabled={!canScrollLeft}
        onClick={() => scroll(-1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <div className="games-row-track" ref={railRef}>
        {GAMES.map((game) => (
          <a
            className="game-card"
            href={`https://www.netflix.com/pk/games/${game.id}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Explore ${game.title} on Netflix Games`}
            key={game.id}
          >
            <span className="game-card-art" aria-hidden="true">
              <img src={game.image} alt="" loading="lazy" style={{ objectPosition: game.position }} />
              <span className="game-card-shade" />
              <span className="game-card-mark">{game.title}</span>
              <span className="game-card-open" aria-hidden="true">↗</span>
            </span>
          </a>
        ))}
      </div>
      <button
        type="button"
        className="games-row-arrow right"
        aria-label="Next games"
        disabled={!canScrollRight}
        onClick={() => scroll(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </section>
  );
}
