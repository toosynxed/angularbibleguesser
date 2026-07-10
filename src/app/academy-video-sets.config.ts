// Static, curated configuration for the Academy of Challenges experimental video mode.
//
// Kept as plain code (not Firestore) because:
// - The content is curated/authored by the developer, not user-generated.
// - `sets` (src/app/sets.model.ts) and the `sets` Firestore collection are for
//   community-uploaded verse sets (see SetsBoard / Home's "Verse Board" modal) -
//   mixing curated Academy content into that collection would conflate two
//   different data ownership models and rely on the same wide-open Firestore
//   rules that currently protect user-uploaded sets.
// - No daily rotation is required for this content (unlike the marketplace or
//   racetrack), so there is no get-or-create-by-date need here.
//
// If curated sets ever need to be editable without a redeploy, this is the
// place to migrate to a Firestore collection (e.g. `academy_video_sets`).
//
// Video hosting note: lesson videos (e.g. BibleProject) are embedded via their
// official YouTube/Vimeo/BibleProject embed URLs (iframe), NOT downloaded or
// rehosted in Firebase Storage or src/assets. This respects third-party terms
// that permit embedding/linking but not rehosting. A visible attribution
// (authorName + authorUrl) must be shown next to the embed.

export interface AcademyVideoSet {
  id: string;
  title: string;
  description: string;
  /** Official embeddable URL (YouTube/Vimeo/BibleProject embed link) for the lesson video. */
  embedUrl: string;
  /** Canonical page/watch URL for the video, used for the "Watch on..." link and attribution. */
  sourceUrl: string;
  /** Content creator/owner to credit, e.g. "BibleProject". */
  authorName: string;
  /** Link to the creator's site, e.g. https://www.bibleproject.com. */
  authorUrl: string;
  /** Image/card shown on the Academy menu before entering this experimental mode. */
  cardImageUrl: string;
  /** Curated verse IDs (from assets/net_cleaned.csv) played after the video step. Exactly 5 expected. */
  verseIds: number[];
  /** Per-set time limit in seconds; use 0 for untimed. */
  timeLimit: number;
}

export const ACADEMY_VIDEO_SETS: AcademyVideoSet[] = [
  {
    id: 'exodus-part-1',
    title: 'Exodus from Egypt',
    description: 'BibleProject intro, then play through Exodus 1-18',
    embedUrl: 'https://www.youtube.com/embed/jH_aojNJM3E',
    sourceUrl: 'https://www.youtube.com/watch?v=jH_aojNJM3E',
    authorName: 'BibleProject',
    authorUrl: 'https://www.bibleproject.com',
    cardImageUrl: 'assets/academy-icon.png',
    verseIds: [1540, 1594, 1605, 1706, 1846],
    timeLimit: 45
  },
  {
    id: 'genesis-origins',
    title: 'Origins in Genesis',
    description: 'BibleProject intro, then play through Genesis 1-11',
    embedUrl: 'https://www.youtube.com/embed/GQI72THyO5I',
    sourceUrl: 'https://www.youtube.com/watch?v=GQI72THyO5I',
    authorName: 'BibleProject',
    authorUrl: 'https://www.bibleproject.com',
    cardImageUrl: 'assets/academy-icon.png',
    verseIds: [1, 27, 48, 71, 276],
    timeLimit: 45
  },
  {
    id: 'beatitudes-focus',
    title: 'Beatitudes Focus',
    description: 'BibleProject intro, then play through Matthew 5:3-7.',
    embedUrl: 'https://www.youtube.com/embed/3Dv4-n6OYGI',
    sourceUrl: 'https://www.youtube.com/watch?v=3Dv4-n6OYGI',
    authorName: 'BibleProject',
    authorUrl: 'https://www.bibleproject.com',
    cardImageUrl: 'assets/academy-icon.png',
    verseIds: [23238, 23239, 23240, 23241, 23242],
    timeLimit: 45
  }
];

export const DEFAULT_ACADEMY_VIDEO_SET_ID: string | null = ACADEMY_VIDEO_SETS[0]?.id ?? null;

export function getAcademyVideoSetById(id: string): AcademyVideoSet | undefined {
  return ACADEMY_VIDEO_SETS.find(set => set.id === id);
}
