import tmdbLogo from '../assets/tmdb-blue-long.svg';

export const TmdbAttribution = ({ className }: { className?: string }) => (
  <div className={className}>
    <img
      src={tmdbLogo}
      alt="TMDB"
      style={{ width: 160, maxWidth: '100%', height: 'auto' }}
    />
    <p>
      This product uses the TMDB API but is not endorsed or certified by TMDB.
    </p>
  </div>
);
