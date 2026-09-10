import { PUBLIC_WORKS } from "./portfolio";

export const PATTERN_TOPICS = [
  {
    slug: "geometric", name: "Geometric patterns", title: "Free Geometric Peyote Bracelet Patterns",
    description: "Explore diamond motifs and repeating beadwork patterns. Compare palettes, preview a bracelet, and customize a free peyote chart in your browser.",
    intro: "A repeating shape gives a bracelet its rhythm. These diamond studies use a staggered peyote grid, with outlines and contrasting centres that you can recolour independently.",
    category: "Geometric", slugs: ["tidal-rhythm", "midnight-prism", "terracotta-tide", "silver-hour"],
    sections: [
      { title: "Choose contrast before colour", body: "A diamond is easier to distinguish when the outline, centre, and background have different lightness. Compare Midnight Prism with Silver Hour: the same motif remains readable in blue and in grey. Try Moonlight in a pattern preview to explore this yourself." },
      { title: "Plan the repeat at the edges", body: "Changing bracelet length can cut through a motif. Open the full chart after resizing and check both ends before exporting. The studio lets you align the existing pattern at the top left or crop and expand from the centre." },
      { title: "Match the size to your wrist", body: "Enter wrist size, clasp length, and ease in the studio. Review the suggested column count before applying it. Finished dimensions depend on your actual beads and tension, so compare a small sample with the estimate before making the whole band." },
    ],
    tip: "Start with Midnight Prism if you want to explore this collection with four colours.",
  },
  {
    slug: "floral", name: "Floral patterns", title: "Free Floral Peyote Bracelet Patterns",
    description: "Discover flower-inspired bead bracelet patterns. Compare dark and light grounds, try new petal colours, and edit your own floral peyote chart for free.",
    intro: "Small flowers become a repeating garden on a peyote grid. These two studies share a floral structure but use different backgrounds and palettes, so you can compare the effect before choosing your own colours.",
    category: "Botanical", slugs: ["wildflower-study", "ivory-garden"],
    sections: [
      { title: "Begin with the background", body: "Wildflower Study sets bright petals against charcoal. Ivory Garden starts with a pale ground and uses softer greens and blues. Keeping the flowers unchanged while switching the ground is a useful way to test the overall mood." },
      { title: "Give the flowers a shared centre", body: "The flower centres use one colour throughout these patterns. Keeping that colour consistent helps connect the different petals. In the studio, Replace colour updates every bead of a selected colour at once." },
      { title: "Check your physical palette", body: "A pale petal can disappear against a pale background, especially when both beads have reflective finishes. Compare a small group of your actual beads in daylight before making the band. The preview colours are digital approximations, not manufacturer colour matches." },
    ],
    tip: "Compare the full charts to see how a different ground changes the same flower motif.",
  },
  {
    slug: "first-peyote-pattern", name: "Your first pattern", title: "Choose and Customize Your First Peyote Bracelet Pattern",
    description: "A practical guide to choosing a peyote bracelet chart, changing its colours, checking the size, and exporting a printable pattern without an account.",
    intro: "Start with a design you like and make one change at a time. This guide covers using the design tool; learning the physical peyote stitch is a separate step. A clear repeat and a small palette can make the chart easier to organise.",
    category: null, slugs: ["midnight-prism", "silver-hour", "tidal-rhythm"],
    sections: [
      { title: "1. Choose a chart you can follow", body: "Midnight Prism and Silver Hour each use four colours. Fewer colours reduce the number of bead containers to manage, but do not by themselves determine stitching difficulty. Open the complete chart and look for a repeat you can recognise." },
      { title: "2. Try a palette, then open the studio", body: "Choose Original, Moonlight, Rosewood, or Woodland on a pattern page. The preview and material counts update together. Continue with these colours opens your own editable copy. You can rename it, change an individual colour, and undo edits." },
      { title: "3. Check size and save your copy", body: "Enter your wrist measurement and clasp size in the studio. Review any resize before applying it. Select Save work to keep the design in this browser. Guest work stays on this device; clearing browser data removes it." },
      { title: "4. Export and follow the chart", body: "Export a PDF for numbered chart sections, colour symbols, and material quantities. In Making mode, follow one chart column at a time and mark it complete. These columns describe positions in this tool's chart; use a suitable peyote-stitch tutorial to learn the threading technique." },
    ],
    tip: "For your first edit, change one colour and compare it with the original before adjusting the size.",
  },
] as const;

export function patternTopic(slug: string) { return PATTERN_TOPICS.find(topic => topic.slug === slug); }
export function topicWorks(topic: typeof PATTERN_TOPICS[number]) { return topic.slugs.flatMap(slug => PUBLIC_WORKS.filter(work => work.slug === slug)); }
export function topicForCategory(category: string) { return PATTERN_TOPICS.find(topic => topic.category === category); }
