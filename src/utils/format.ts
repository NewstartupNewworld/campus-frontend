const ACRONYMS = new Set(['iit', 'nit', 'iiit', 'iiser', 'iim', 'iisc', 'bits', 'aiims', 'vit', 'srm', 'du', 'jnu', 'bhu', 'amu', 'mit', 'dtu', 'nsut', 'nift', 'nid', 'lpu', 'kiit', 'jmi', 'ignou', 'nlu', 'jipmer', 'mnnit', 'svnit', 'vnit']);

/** Shows short college codes in capital letters, for example "Iit Delhi" as "IIT Delhi". Other words stay as typed. */
export const prettyCollege = (name: unknown): string =>
  String(name ?? '').trim().split(/\s+/).map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w)).join(' ');
// END OF FILE