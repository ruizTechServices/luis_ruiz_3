export type ProjectScreenshot = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

type EvidenceItem = {
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
};

type ProjectEvidence = {
  capturedAt: string;
  screenshots: ProjectScreenshot[];
  checks: EvidenceItem[];
};

// Real public UI captures. Stable database IDs keep the evidence attached when
// a title or slug is edited. Source and capture provenance: docs/case-study-evidence.md.
const evidence: Record<number, ProjectEvidence> = {
  5: {
    capturedAt: "2026-09-07",
    screenshots: [
      {
        src: "/images/projects/catherine-introduction.webp",
        width: 1348,
        height: 926,
        alt: "Catherine Ruiz’s homepage with English and Spanish introduction, portrait, and call button.",
        caption: "The introduction presents both languages together and gives visitors a direct way to call Catherine.",
      },
      {
        src: "/images/projects/catherine-spanish-brochure.webp",
        width: 1035,
        height: 769,
        alt: "The Spanish brochure selected on Catherine Ruiz’s website, with the embedded Avon campaign viewer below.",
        caption: "Selecting Español switches the embedded brochure to its Spanish edition. The brochure itself is supplied by Avon.",
      },
    ],
    checks: [
      {
        title: "A bilingual browsing flow",
        detail: "The live homepage was checked in both brochure languages. Selecting Español changed the viewer to Spanish controls and campaign content.",
        href: "https://catherineruiz.com/",
        linkLabel: "Explore the bilingual homepage",
      },
      {
        title: "A direct contact action",
        detail: "The homepage call button uses a telephone link. Visitors can start a call without creating an account or navigating a checkout.",
        href: "https://catherineruiz.com/",
        linkLabel: "See the contact experience",
      },
    ],
  },
  6: {
    capturedAt: "2026-09-07",
    screenshots: [
      {
        src: "/images/projects/ruiztechservices-home.webp",
        width: 1348,
        height: 926,
        alt: "ruizTechServices homepage with local tech help headline, request help action, and a grid of common technical problems.",
        caption: "The business homepage starts with recognizable problems and a clear request-help action.",
      },
    ],
    checks: [
      {
        title: "Services come from one catalog",
        detail: "A typed service configuration supplies active offers to the homepage, navigation, and dedicated service pages. Scope, deliverables, and exclusions stay together.",
        href: "https://github.com/ruizTechServices/ruiztechservices-website/blob/ca7251534b749ba23ab3fdbba116a0eb91c4e4c1/lib/jobs/jobs.ts",
        linkLabel: "Read the service catalog source",
      },
      {
        title: "The inquiry asks for useful context",
        detail: "The live form asks for the issue, preferred support, urgency, and optional budget. Its server action assembles those fields into a Supabase inquiry record.",
        href: "https://github.com/ruizTechServices/ruiztechservices-website/blob/ca7251534b749ba23ab3fdbba116a0eb91c4e4c1/lib/actions/contact.ts",
        linkLabel: "Read the inquiry action source",
      },
    ],
  },
  14: {
    capturedAt: "2026-09-07",
    screenshots: [
      {
        src: "/images/projects/soundboard-controls.webp",
        width: 1153,
        height: 795,
        alt: "Gio’s soundboard showing searchable sound pads, category filters, favorite controls, and the persistent audio player.",
        caption: "Search, filters, and favorite controls sit beside the sound pads. The player stays available while browsing the collection.",
      },
    ],
    checks: [
      {
        title: "The original collection is preserved",
        detail: "All 16 original MP3 files were recovered from the earlier repository and compared byte for byte. The recovery record includes the source commit and file hashes.",
        href: "https://github.com/ruizTechServices/luis_ruiz_3/blob/deef92cd5971ff492ea04dbce51f21410cdebd0b/docs/soundboard-provenance.md",
        linkLabel: "Read the audio recovery record",
      },
      {
        title: "Playback has explicit rules",
        detail: "One audio element handles the player. Shared links select a sound without autoplay, and the controls account for loading, pause, completion, and failure.",
        href: "https://github.com/ruizTechServices/luis_ruiz_3/blob/deef92cd5971ff492ea04dbce51f21410cdebd0b/components/soundboard/use-audio-player.ts",
        linkLabel: "Inspect the audio player source",
      },
      {
        title: "Repeat visits keep useful state",
        detail: "Favorites, recent sounds, and settings are stored in the visitor’s browser. Regression checks cover malformed saved data, unavailable storage, daily picks, random selection, and keyboard handling.",
        href: "https://github.com/ruizTechServices/luis_ruiz_3/blob/deef92cd5971ff492ea04dbce51f21410cdebd0b/scripts/verify-soundboard.mjs",
        linkLabel: "Inspect the regression checks",
      },
    ],
  },
};

export function getProjectEvidence(projectId: number) {
  return evidence[projectId];
}
