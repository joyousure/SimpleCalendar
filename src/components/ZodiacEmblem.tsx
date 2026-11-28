import React from 'react';

interface ZodiacEmblemProps {
  zodiac: string;
  className?: string;
}

const VALID_ZODIACS = new Set([
  '鼠',
  '牛',
  '虎',
  '兔',
  '龙',
  '蛇',
  '马',
  '羊',
  '猴',
  '鸡',
  '狗',
  '猪',
]);

export const ZodiacEmblem: React.FC<ZodiacEmblemProps> = ({ zodiac, className = '' }) => {
  const normalizedZodiac = VALID_ZODIACS.has(zodiac) ? zodiac : '龙';

  // Full-body paper-cut style vector illustrations (no text inside artwork).
  // Uses CSS custom properties (--z-main, --z-soft, --z-deep, --z-eye, --z-halo)
  // tuned separately for Light, Dark, and AMOLED environments.
  const renderAnimalSvg = () => {
    switch (normalizedZodiac) {
      case '鼠':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Sweeping curved coral tail */}
            <path
              d="M36 72 C24 75 14 82 20 86 C27 90 43 86 54 84"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            {/* Back ear peeking */}
            <ellipse
              cx="55"
              cy="24"
              rx="4.2"
              ry="5.8"
              transform="rotate(14 55 24)"
              fill="var(--z-deep)"
            />
            {/* Sitting body & pointed profile head */}
            <path
              d="M34 75 C27 72 26 59 32 47 C36 39 42 34 47 30 C51 26 57 25 63 27 C69 29 76 34 79 37 C75 41 68 43 62 44 C64 52 64 61 59 69 C56 75 50 78 44 79 C39 79 36 77 34 75 Z"
              fill="var(--z-main)"
            />
            {/* Soft belly contour */}
            <path
              d="M57 46 C61 53 60 64 54 71 C51 64 52 53 57 46 Z"
              fill="var(--z-soft)"
              opacity="0.72"
            />
            {/* Tucked forepaw & hind foot */}
            <path
              d="M59 48 C65 49 67 53 64 55 C61 56 57 54 57 51 Z"
              fill="var(--z-soft)"
            />
            <path
              d="M39 77 C45 76 55 77 59 80 C60 81.5 55 82.5 47 82.5 C40 82.5 37 79.5 39 77 Z"
              fill="var(--z-deep)"
            />
            {/* Large rounded ear with coral inner cup */}
            <ellipse
              cx="47.5"
              cy="24.5"
              rx="7.2"
              ry="8.8"
              transform="rotate(-18 47.5 24.5)"
              fill="var(--z-main)"
            />
            <ellipse
              cx="48"
              cy="25"
              rx="4.4"
              ry="5.6"
              transform="rotate(-18 48 25)"
              fill="var(--z-soft)"
            />
            {/* Eye, nose & delicate whiskers */}
            <circle cx="64.5" cy="33" r="1.9" fill="var(--z-eye)" />
            <circle cx="65.1" cy="32.4" r="0.6" fill="#ffffff" opacity="0.75" />
            <circle cx="79" cy="37" r="1.7" fill="var(--z-deep)" />
            <path
              d="M76 39.5 L85 38.5 M75 41.5 L84 43"
              stroke="var(--z-soft)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        );

      case '牛':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Slender tail with tuft */}
            <path
              d="M77 45 C83 49 84 61 80 69"
              fill="none"
              stroke="var(--z-main)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <ellipse
              cx="80"
              cy="71"
              rx="2.3"
              ry="3.6"
              transform="rotate(14 80 71)"
              fill="var(--z-deep)"
            />
            {/* Far legs */}
            <path
              d="M38 65 L36 81 L40 81 L43 65 Z M65 64 L63 81 L67 81 L70 64 Z"
              fill="var(--z-deep)"
            />
            {/* Sturdy barrel body & near legs */}
            <path
              d="M30 42 C36 33 51 32 63 35 C73 37 80 42 79 52 C79 60 74 66 68 67 L73 82 L68 82 L62 67 C54 68 44 68 38 67 L33 82 L28 82 L31 65 C25 60 24 50 30 42 Z"
              fill="var(--z-main)"
            />
            {/* Wide upward-curving horns */}
            <path
              d="M27 36 C19 32 15 24 19 18 C19.5 23 23 29 30 32 Z M43 35 C51 31 55 23 51 17 C50.5 22 47 28 40 31 Z"
              fill="var(--z-soft)"
            />
            {/* Ears */}
            <ellipse
              cx="21"
              cy="39"
              rx="4.6"
              ry="2.3"
              transform="rotate(-16 21 39)"
              fill="var(--z-main)"
            />
            <ellipse
              cx="49"
              cy="39"
              rx="4.6"
              ry="2.3"
              transform="rotate(16 49 39)"
              fill="var(--z-main)"
            />
            {/* Broad lowered head */}
            <path
              d="M23 36 C25 29 44 29 46 36 C48 43 46 51 42 54 L26 54 C22 51 21 43 23 36 Z"
              fill="var(--z-main)"
            />
            {/* Plump coral muzzle/snout */}
            <rect x="23" y="47" width="21" height="12" rx="6" fill="var(--z-soft)" />
            <circle cx="29" cy="53" r="1.5" fill="var(--z-deep)" />
            <circle cx="38" cy="53" r="1.5" fill="var(--z-deep)" />
            <circle cx="28.5" cy="41.5" r="1.7" fill="var(--z-eye)" />
            <circle cx="40.5" cy="41.5" r="1.7" fill="var(--z-eye)" />
          </svg>
        );

      case '虎':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* S-curved striped tail */}
            <path
              d="M61 63 C72 65 81 56 80 46 C79 38 72 34 74 28"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="4.4"
              strokeLinecap="round"
            />
            <path
              d="M68 62.5 L71 58.5 M76.5 54 L80.5 51 M77 44 L73 41 M74 34 L77 32"
              stroke="var(--z-deep)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Far legs */}
            <path
              d="M40 62 L31 76 L35 78 L45 64 Z M57 42 L68 48 L66 52 L54 46 Z"
              fill="var(--z-deep)"
            />
            {/* Warm coral rearing body & limbs */}
            <path
              d="M35 28 C37 22 44 19 52 21 C57 22 61 25 60 29 C59 33 55 35 51 35 C55 41 60 50 62 60 C63 67 60 73 56 76 L62 84 L56 85 L49 74 C45 75 41 72 40 66 C39 58 36 48 34 40 C31 35 33 31 35 28 Z"
              fill="var(--z-soft)"
            />
            <path d="M44 43 L56 53 L53 57 L41 47 Z" fill="var(--z-soft)" />
            <path d="M40 65 L35 83 L41 84 L46 67 Z" fill="var(--z-soft)" />
            {/* Deep crimson back & crown cap */}
            <path
              d="M35 28 C38 21 48 19 55 22 C58 24 58 27 54 28 C48 29 44 33 44 39 C44 48 52 58 55 69 C50 67 44 58 40 48 C37 40 33 33 35 28 Z"
              fill="var(--z-main)"
            />
            {/* Bold tiger stripes */}
            <path
              d="M40 34 L48 33 M42 40 L51 39 M44 46 L54 45 M46 53 L57 52 M48 60 L59 59 M42 70 L45 74 M52 75 L57 78"
              stroke="var(--z-deep)"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            <circle cx="40" cy="21" r="3" fill="var(--z-main)" />
            <circle cx="51" cy="25.5" r="1.6" fill="var(--z-eye)" />
            <path d="M55.5 28.5 L60 30.5 L56 32.5 Z" fill="var(--z-deep)" />
          </svg>
        );

      case '兔':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Fluffy tail puff */}
            <circle cx="30.5" cy="72" r="5" fill="var(--z-main)" />
            <circle cx="29.5" cy="71" r="2.7" fill="var(--z-soft)" />
            {/* Far swept-back ear */}
            <path
              d="M55 22 C46 13 34 10 27 13 C32 18 42 22 52 25 Z"
              fill="var(--z-deep)"
              opacity="0.82"
            />
            {/* Upright plump sitting rabbit body & head */}
            <path
              d="M49 24 C56 20 66 22 70 28 C73 32 70 37 64 39 C61 40 60 42 62 46 C67 54 67 66 61 75 C57 81 48 83 39 81 C32 79 29 72 32 62 C35 51 42 42 46 37 C45 31 46 27 49 24 Z"
              fill="var(--z-main)"
            />
            {/* Near long ear with soft coral inner groove */}
            <path
              d="M52 24 C40 18 26 16 20 20 C24 25 36 27 49 29 Z"
              fill="var(--z-main)"
            />
            <path
              d="M48 25 C38 20 28 19 23 21 C27 24 37 25 46 27 Z"
              fill="var(--z-soft)"
            />
            {/* Soft chest & belly contour */}
            <path
              d="M59 43 C64 51 64 62 59 71 C55 64 55 52 59 43 Z"
              fill="var(--z-soft)"
              opacity="0.82"
            />
            {/* Tucked forepaw & resting hind foot */}
            <path
              d="M60 49 C65 50 67 54 64 56 C61 57 58 55 58 52 Z"
              fill="var(--z-soft)"
            />
            <path
              d="M44 79 L62 80 C65 80 66 83 62 84 L42 84 C39 84 40 79 44 79 Z"
              fill="var(--z-deep)"
            />
            <circle cx="63.5" cy="29.5" r="1.8" fill="var(--z-eye)" />
            <circle cx="64.1" cy="28.9" r="0.55" fill="#ffffff" opacity="0.75" />
            <circle cx="70.5" cy="31.5" r="1.5" fill="var(--z-soft)" />
          </svg>
        );

      case '龙':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Flared tail plume */}
            <path
              d="M77 50 C83 45 87 38 85 32 C81 36 77 38 75 42 C79 41 83 39 86 38"
              fill="var(--z-soft)"
              stroke="var(--z-soft)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dorsal spine spikes */}
            <path
              d="M31 32 L35 25 M36 35 L41 29 M48 42 L51 36 M55 44 L59 39 M69 57 L73 53"
              stroke="var(--z-soft)"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            {/* Claws */}
            <path
              d="M30 67 L24 75 M30 67 L28 76 M47 57 L42 65 M61 67 L57 75 M75 66 L80 73"
              stroke="var(--z-deep)"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
            {/* Sinuous S-coil dragon body */}
            <path
              d="M27 37 C23 47 23 64 33 70 C42 75 47 62 51 54 C54 48 58 49 60 55 C62 63 66 72 74 69 C80 67 82 57 78 49"
              fill="none"
              stroke="var(--z-main)"
              strokeWidth="9.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Segmented coral belly scales */}
            <path
              d="M27 42 C24 52 25 65 34 69 C41 72 46 61 50 53 C54 47 58 49 60 56 C62 64 67 71 74 68"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="3.1"
              strokeDasharray="3.4 2.8"
              strokeLinecap="round"
            />
            {/* Horned dragon head & whiskers */}
            <path
              d="M15 36 C18 30 28 29 33 34 C35 37 33 42 27 43 C21 44 16 41 15 36 Z"
              fill="var(--z-main)"
            />
            <path
              d="M26 30 L29 20 M30 31 L36 23"
              stroke="var(--z-soft)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M16 38 C12 40 11 45 14 48 M18 40 C15 43 16 47 19 49"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="22.5" cy="34.5" r="1.7" fill="var(--z-eye)" />
          </svg>
        );

      case '蛇':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Under-coil shadow depth */}
            <path
              d="M32 74 C44 82 67 80 71 67 C74 56 56 52 43 52"
              fill="none"
              stroke="var(--z-deep)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Coiled figure-S serpent body */}
            <path
              d="M29 71 C39 81 66 79 70 66 C73 55 54 51 42 49 C29 47 26 36 33 28 C40 20 55 21 63 27"
              fill="none"
              stroke="var(--z-main)"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Smooth coral inner belly contour */}
            <path
              d="M32 73 C42 80 63 78 67 66 C70 57 54 53 42 51 C31 49 29 38 35 30 C41 23 54 23 61 28"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            {/* Sleek head & forked tongue */}
            <ellipse
              cx="66"
              cy="28"
              rx="7.5"
              ry="5.5"
              transform="rotate(-8 66 28)"
              fill="var(--z-main)"
            />
            <circle cx="67.5" cy="26.8" r="1.6" fill="var(--z-eye)" />
            <path
              d="M73 29 L81 29 M81 29 L84.5 26.5 M81 29 L84.5 31.5"
              fill="none"
              stroke="var(--z-deep)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );

      case '马':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Billowing coral tail */}
            <path
              d="M27 46 C18 48 14 57 18 68 C21 63 23 58 26 53 C22 60 22 67 25 71 C27 64 29 56 30 49 Z"
              fill="var(--z-soft)"
            />
            {/* Far hind & raised foreleg */}
            <path
              d="M36 58 L30 80 L34 81 L40 60 Z M58 56 L66 70 L60 77 L56 75 L61 69 L54 58 Z"
              fill="var(--z-deep)"
            />
            {/* Galloping horse body, arched neck & near legs */}
            <path
              d="M28 45 C37 42 49 41 58 37 C62 30 65 24 69 21 L72 17 L74 21 C78 23 82 28 83 33 C80 35 76 34 74 31 C71 36 69 44 65 51 C63 55 59 58 55 59 L59 80 L55 81 L50 60 C44 61 38 61 34 60 L38 80 L34 81 L28 59 C25 54 25 48 28 45 Z"
              fill="var(--z-main)"
            />
            {/* Flowing coral mane */}
            <path
              d="M68 20 C62 20 55 23 49 29 C53 29 57 27 60 26 C55 30 51 34 48 39 C54 37 60 33 64 28 Z"
              fill="var(--z-soft)"
            />
            <circle cx="74.5" cy="24.5" r="1.5" fill="var(--z-eye)" />
          </svg>
        );

      case '羊':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Far legs */}
            <path
              d="M39 58 L35 81 L39 81 L43 59 Z M66 57 L69 81 L73 81 L70 57 Z"
              fill="var(--z-deep)"
            />
            {/* Upright tail */}
            <path
              d="M74 46 C78 44 81 41 80 38 C77 39 74 42 73 45 Z"
              fill="var(--z-main)"
            />
            {/* Standing mountain goat body & near legs */}
            <path
              d="M22 36 C25 32 31 30 35 32 C38 35 42 40 50 40 C60 40 70 41 75 47 C77 52 74 60 67 62 L63 81 L59 81 L61 62 C52 63 44 62 38 60 L30 81 L26 81 L32 57 C28 53 28 47 29 43 C24 43 20 40 22 36 Z"
              fill="var(--z-main)"
            />
            {/* Sweeping curved horns */}
            <path
              d="M29 29 C27 21 32 15 39 17 C35 19 33 23 33 29 Z M33 29 C35 21 41 16 47 19 C43 21 39 24 37 30 Z"
              fill="var(--z-soft)"
            />
            {/* Alert ear, goatee beard & eye */}
            <ellipse
              cx="37"
              cy="33"
              rx="4.5"
              ry="2.2"
              transform="rotate(-12 37 33)"
              fill="var(--z-main)"
            />
            <path d="M25 43 L27 50 L30 44 Z" fill="var(--z-soft)" />
            <circle cx="26.5" cy="35" r="1.5" fill="var(--z-eye)" />
          </svg>
        );

      case '猴':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Tall S-spiral coral tail */}
            <path
              d="M58 52 C69 49 79 40 77 28 C75 19 64 17 59 24 C56 29 61 34 65 31"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            {/* Far arm & hind leg */}
            <path
              d="M37 49 L32 76 L36 77 L41 51 Z M55 56 L61 77 L65 76 L59 55 Z"
              fill="var(--z-deep)"
            />
            {/* Agile body & near limbs */}
            <path
              d="M35 44 C38 39 50 40 57 46 C61 50 61 57 57 62 L51 77 L46 77 L50 61 C45 60 40 58 37 54 L28 76 L24 76 L32 49 C32 46 33 45 35 44 Z"
              fill="var(--z-main)"
            />
            {/* Round head & side ear */}
            <circle cx="32" cy="35" r="9.5" fill="var(--z-main)" />
            <circle
              cx="40.5"
              cy="34"
              r="3.5"
              fill="var(--z-soft)"
              stroke="var(--z-main)"
              strokeWidth="1.4"
            />
            {/* Coral face mask */}
            <path
              d="M24 33 C24 29 28 28 31 30 C34 28 38 29 38 33 C38 39 34 42 31 42 C27 42 24 39 24 33 Z"
              fill="var(--z-soft)"
            />
            <circle cx="28" cy="33" r="1.4" fill="var(--z-eye)" />
            <circle cx="33.5" cy="33" r="1.4" fill="var(--z-eye)" />
            <path
              d="M28.5 38 Q31 40 33.5 38"
              fill="none"
              stroke="var(--z-deep)"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        );

      case '鸡':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Sweeping layered tail plumes */}
            <path
              d="M56 44 C66 30 82 32 85 45 C77 41 68 44 62 50 Z"
              fill="var(--z-deep)"
            />
            <path
              d="M58 49 C69 38 83 43 84 56 C76 50 67 51 60 55 Z"
              fill="var(--z-main)"
            />
            <path
              d="M57 54 C67 48 78 55 77 66 C71 59 64 59 57 60 Z"
              fill="var(--z-deep)"
            />
            {/* Slender legs & claws */}
            <path
              d="M44 65 L42 79 M42 79 L37 81 M42 79 L45 81 M52 65 L54 79 M54 79 L49 81 M54 79 L57 81"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Strutting body & wing */}
            <path
              d="M31 44 C31 56 38 67 50 67 C58 67 63 60 61 50 C59 44 51 42 43 43 Z"
              fill="var(--z-main)"
            />
            <path
              d="M41 48 C47 46 55 48 56 54 C55 60 47 61 42 57 C39 54 39 50 41 48 Z"
              fill="var(--z-deep)"
              opacity="0.74"
            />
            {/* Coral neck hackles & head */}
            <path
              d="M27 31 C27 25 35 24 38 30 C41 36 44 42 42 47 C37 49 30 46 29 40 C27 36 27 33 27 31 Z"
              fill="var(--z-soft)"
            />
            {/* Scalloped comb, beak & wattle */}
            <path
              d="M28 26 C26 21 30 19 32 22 C33 18 37 19 37 23 C39 20 42 23 39 27 Z"
              fill="var(--z-main)"
            />
            <path d="M27 30 L21 32 L27 34 Z" fill="var(--z-soft)" />
            <ellipse cx="29" cy="36" rx="2.1" ry="3.1" fill="var(--z-main)" />
            <circle cx="31.5" cy="29.5" r="1.5" fill="var(--z-eye)" />
          </svg>
        );

      case '狗':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Far legs */}
            <path
              d="M38 62 L35 81 L39 81 L42 63 Z M61 60 L63 81 L67 81 L65 60 Z"
              fill="var(--z-deep)"
            />
            {/* Loyal upright body, curled tail & pointed ears */}
            <path
              d="M22 33 C25 29 31 27 36 29 L38 22 L42 29 C45 34 49 41 56 42 C64 42 70 43 74 37 C77 32 75 26 70 28 C76 22 83 28 81 37 C79 44 74 49 71 53 C71 60 69 66 68 81 L63 81 L64 63 C55 64 45 64 38 62 L32 81 L27 81 L31 57 C28 51 28 43 27 39 C23 39 20 36 22 33 Z"
              fill="var(--z-main)"
            />
            {/* Warm coral cheek, chest, belly & foreleg */}
            <path
              d="M28 36 C31 35 35 37 37 42 C41 48 47 52 56 54 C58 58 55 62 47 62 C41 62 36 59 33 56 L30 79 L27 79 L30 56 C27 50 27 42 28 36 Z"
              fill="var(--z-soft)"
            />
            <circle cx="29" cy="32.5" r="1.5" fill="var(--z-eye)" />
            <circle cx="21.8" cy="33.5" r="1.6" fill="var(--z-deep)" />
          </svg>
        );

      case '猪':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <circle cx="50" cy="50" r="40" fill="var(--z-halo)" />
            {/* Tiny spring curly tail */}
            <path
              d="M77 45 C82 43 85 38 82 35 C79 34 78 38 81 39 C84 39 86 35 84 32"
              fill="none"
              stroke="var(--z-soft)"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            {/* Far legs */}
            <path
              d="M36 63 L33 77 L37 77 L40 63 Z M65 62 L63 77 L67 77 L69 62 Z"
              fill="var(--z-deep)"
            />
            {/* Second perked ear */}
            <path d="M34 35 L37 26 L41 34 Z" fill="var(--z-deep)" />
            {/* Plump rounded body & legs */}
            <path
              d="M18 46 C20 42 24 41 26 39 L28 28 L34 36 C38 35 44 34 52 34 C65 34 77 40 77 51 C77 60 72 65 68 67 L70 78 L65 78 L62 66 C53 67 42 67 35 65 L31 78 L26 78 L28 62 C23 59 20 55 18 51 Z"
              fill="var(--z-main)"
            />
            {/* Coral inner ear, belly highlight & snout disc */}
            <path d="M29 36 L30 30 L33 35 Z" fill="var(--z-soft)" />
            <ellipse
              cx="18.5"
              cy="48.5"
              rx="3.1"
              ry="4.2"
              transform="rotate(-12 18.5 48.5)"
              fill="var(--z-soft)"
            />
            <path
              d="M37 62 C46 65 56 64 62 61 C55 66 44 66 37 62 Z"
              fill="var(--z-soft)"
              opacity="0.82"
            />
            <circle cx="27.5" cy="42.5" r="1.5" fill="var(--z-eye)" />
            <circle cx="17.8" cy="48" r="0.9" fill="var(--z-deep)" />
            <circle cx="19.3" cy="49.2" r="0.9" fill="var(--z-deep)" />
          </svg>
        );
    }
  };

  return (
    <div
      className={[
        'relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center p-1 shrink-0 transition-all overflow-hidden',
        // Theme-adaptive glass tile surfaces (Light -> Dark -> AMOLED)
        'bg-gradient-to-br from-[#FFF9F8] via-white to-[#F9ECEA] border-[#EDD5D4]/85 shadow-[0_3px_12px_rgba(179,27,34,0.07),inset_0_1px_1px_rgba(255,255,255,0.95)]',
        'dark:from-[#261C1E]/92 dark:via-[#1C1718]/95 dark:to-[#151213]/95 dark:border-white/[0.11] dark:shadow-[0_4px_14px_rgba(0,0,0,0.42),inset_0_1px_0.5px_rgba(255,255,255,0.08)]',
        '[.amoled-mode_&]:from-[#130A0C] [.amoled-mode_&]:via-[#090708] [.amoled-mode_&]:to-[#040303] [.amoled-mode_&]:border-white/[0.08] [.amoled-mode_&]:shadow-[0_2px_10px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.04)]',
        // Semantic paper-cut artwork color tokens across Light / Dark / AMOLED
        '[--z-main:#B31B22] [--z-soft:#EF8B82] [--z-deep:#630C12] [--z-eye:#280507] [--z-halo:rgba(179,27,34,0.065)]',
        'dark:[--z-main:#DF565C] dark:[--z-soft:#F5A69E] dark:[--z-deep:#7E1C24] dark:[--z-eye:#220507] dark:[--z-halo:rgba(223,86,92,0.095)]',
        '[.amoled-mode_&]:[--z-main:#C74A51] [.amoled-mode_&]:[--z-soft:#DF928A] [.amoled-mode_&]:[--z-deep:#63151C] [.amoled-mode_&]:[--z-eye:#190406] [.amoled-mode_&]:[--z-halo:rgba(199,74,81,0.065)]',
        className,
      ].join(' ')}
      title={`${normalizedZodiac}年`}
      aria-label={`${normalizedZodiac}年`}
    >
      {/* Subtle top Liquid Glass sheen tuned softly for Dark & AMOLED */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-2.5 rounded-full bg-white/50 dark:bg-white/[0.06] [.amoled-mode_&]:bg-white/[0.025] blur-[1px]"
      />
      {renderAnimalSvg()}
    </div>
  );
};
