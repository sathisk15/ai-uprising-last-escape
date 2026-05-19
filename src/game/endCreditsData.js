/**
 * End-roll copy (Victory → Credits). Plain strings are paragraphs; `{ text, url }` renders a tap/click link.
 * @typedef {{ headline: string, lines: Array<string | { text: string, url?: string }> }} CreditSection
 */

/** @type {CreditSection[]} */
export const END_CREDITS_SECTIONS = [
  {
    headline: 'AI UPRISING: LAST ESCAPE',
    lines: [
      'Master of Science — Applied Computer Science',
      'Video Game Design • academic milestone project',
    ],
  },
  {
    headline: 'LEAD DEVELOPER',
    lines: ['Sathiskumar Ravichandran', 'Student ID · 288860'],
  },
  {
    headline: 'COHORT CREDIT',
    lines: [
      'Ritik Gandhi',
      'Class attendance • faculty-facing milestone presentation',
    ],
  },
  {
    headline: 'FACULTY',
    lines: [
      'Wrocław University of Science & Technology · Video Game Design (M.Sc. ACS)',
      'Marek Kopel — supervising instructor • Wednesday 13:15 section',
      {
        text: 'Course hub · timetable & office hours (Kopel)',
        url: 'https://kis.pwr.edu.pl/kopel',
      },
      'Barbara Wędrychowicz — parallel cohorts • Wednesday 07:30 · 09:15',
    ],
  },
  {
    headline: 'ARCHIVE CHANNELS',
    lines: [
      {
        text: 'Source repository · GitHub',
        url: 'https://github.com/sathisk15/ai-uprising-last-escape',
      },
      {
        text: 'Professional profile · LinkedIn',
        url: 'https://www.linkedin.com/in/sathiskumar-ravichandran/',
      },
    ],
  },
  {
    headline: 'RUNTIME CELL',
    lines: ['Engineering • React • Three.js • @react-three/fiber', 'Build toolchain • Vite 5 • Tailwind CSS • Zustand'],
  },
  {
    headline: 'OPERATIONS',
    lines: ['Game design • Zones • Progression tuning', 'UI / HUD • Audio • Firebase hosting'],
  },
  {
    headline: 'SPECIAL THANKS',
    lines: ['Course staff and peers • Play-test feedback', 'Open-source libraries and tooling', 'Anyone who chased the BLACKOUT uplink'],
  },
  {
    headline: '',
    lines: ['SIGNAL RESTORED', 'UNTIL NEXT UPRISING…'],
  },
]
