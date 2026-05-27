import { useTheme } from '../context/ThemeContext';

/**
 * SpaceBackground — immersive 3-D space scene rendered globally behind all pages.
 * Contains: shooting stars, twinkling stars, floating asteroids, distant orbiting planets,
 * nebula wisps, moon craters.  All purely CSS-driven for performance.
 */
export default function SpaceBackground() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="ambient-bg" aria-hidden="true">
      {/* Nebula colour washes */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Shooting stars ── */}
      <div className="shooting-star" style={{ top: '12%', left: '15%', animationDelay: '0s',   animationDuration: '6s' }} />
      <div className="shooting-star" style={{ top: '28%', left: '55%', animationDelay: '3s',   animationDuration: '8s' }} />
      <div className="shooting-star" style={{ top: '8%',  left: '78%', animationDelay: '7s',   animationDuration: '5s' }} />
      <div className="shooting-star" style={{ top: '45%', left: '30%', animationDelay: '11s',  animationDuration: '7s' }} />
      <div className="shooting-star" style={{ top: '65%', left: '70%', animationDelay: '15s',  animationDuration: '6s' }} />

      {/* ── Twinkling stars (different sizes) ── */}
      {[
        { top:'5%',  left:'8%',  s:3, d:'2.1s' },
        { top:'12%', left:'42%', s:2, d:'3.4s' },
        { top:'18%', left:'88%', s:4, d:'1.8s' },
        { top:'30%', left:'22%', s:2, d:'4.2s' },
        { top:'35%', left:'65%', s:3, d:'2.6s' },
        { top:'48%', left:'12%', s:2, d:'3.8s' },
        { top:'55%', left:'90%', s:3, d:'1.5s' },
        { top:'62%', left:'48%', s:2, d:'4.6s' },
        { top:'75%', left:'75%', s:4, d:'2.3s' },
        { top:'82%', left:'32%', s:2, d:'3.1s' },
        { top:'88%', left:'58%', s:3, d:'2.8s' },
        { top:'92%', left:'15%', s:2, d:'4.0s' },
        { top:'22%', left:'52%', s:3, d:'1.9s' },
        { top:'42%', left:'82%', s:2, d:'3.5s' },
        { top:'70%', left:'5%',  s:3, d:'2.4s' },
      ].map((star, i) => (
        <div key={i} className="twinkle-star" style={{
          top: star.top, left: star.left,
          width: star.s, height: star.s,
          animationDelay: star.d,
        }} />
      ))}

      {/* ── Floating asteroids / space debris ── */}
      <div className="asteroid asteroid-1" />
      <div className="asteroid asteroid-2" />
      <div className="asteroid asteroid-3" />

      {/* ── Distant mini planets in orbit ── */}
      <div className="orbit-ring">
        <div className="orbit-planet orbit-planet-1" />
      </div>
      <div className="orbit-ring orbit-ring-2">
        <div className="orbit-planet orbit-planet-2" />
      </div>

      {/* ── Nebula wisps / cosmic dust clouds ── */}
      <div className="nebula-wisp nebula-wisp-1" />
      <div className="nebula-wisp nebula-wisp-2" />
      <div className="nebula-wisp nebula-wisp-3" />

      {/* ── Moon craters (visible only in dark) ── */}
      <div className="moon-crater" style={{ width: '4.5vmin', height: '4.5vmin', top: 'calc(50% - 8vmin)',  left: 'calc(50% - 3vmin)' }} />
      <div className="moon-crater" style={{ width: '3vmin',   height: '3vmin',   top: 'calc(50% + 3vmin)',  left: 'calc(50% + 5vmin)' }} />
      <div className="moon-crater" style={{ width: '2vmin',   height: '2vmin',   top: 'calc(50% - 1vmin)',  left: 'calc(50% + 9vmin)' }} />
      <div className="moon-crater" style={{ width: '1.5vmin', height: '1.5vmin', top: 'calc(50% + 8vmin)',  left: 'calc(50% - 6vmin)' }} />
      <div className="moon-crater" style={{ width: '2.5vmin', height: '2.5vmin', top: 'calc(50% + 6vmin)',  left: 'calc(50% + 1vmin)' }} />
    </div>
  );
}
