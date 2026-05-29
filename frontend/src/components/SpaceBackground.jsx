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

      {/* ── Shooting stars (Reduced for performance) ── */}
      <div className="shooting-star" style={{ top: '12%', left: '15%', animationDelay: '0s',   animationDuration: '6s' }} />
      <div className="shooting-star" style={{ top: '28%', left: '55%', animationDelay: '3s',   animationDuration: '8s' }} />

      {/* ── Twinkling stars (Reduced for performance) ── */}
      {[
        { top:'5%',  left:'8%',  s:3, d:'2.1s' },
        { top:'18%', left:'88%', s:4, d:'1.8s' },
        { top:'30%', left:'22%', s:2, d:'4.2s' },
        { top:'55%', left:'90%', s:3, d:'1.5s' },
        { top:'75%', left:'75%', s:4, d:'2.3s' },
        { top:'92%', left:'15%', s:2, d:'4.0s' },
        { top:'42%', left:'82%', s:2, d:'3.5s' },
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
    </div>
  );
}
