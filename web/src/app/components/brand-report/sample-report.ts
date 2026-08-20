import type { BrandReport } from '../../services/brand-report';

/**
 * Rapport de DÉMONSTRATION, sur le nom du produit lui-même.
 *
 * Sert à montrer ce qu'on achète, sans rien acheter — sur la page publique
 * comme dans le wizard. Il vivait dans le composant wizard, ce qui interdisait
 * de le montrer à un visiteur non connecté : or c'est précisément à lui qu'il
 * sert le plus.
 *
 * Les verdicts sont réels au moment où ils ont été relevés, et volontairement
 * mêlés — libre, pris, non vérifiable. Un exemple où tout est vert ne montre
 * pas ce que le produit sait faire ; il montre un cas chanceux.
 */
export const SAMPLE_REPORT: BrandReport = {
  name: 'namorama',
  handle: 'namorama',
  domains: [
    { extension: 'com', domain: 'namorama.com', status: 'taken' },
    { extension: 'fr', domain: 'namorama.fr', status: 'free' },
    { extension: 'io', domain: 'namorama.io', status: 'free' },
    { extension: 'net', domain: 'namorama.net', status: 'free' },
    { extension: 'app', domain: 'namorama.app', status: 'unknown' },
  ],
  // Les SIX plateformes réellement interrogées, comme un vrai rapport. Le
  // rapport d'exemple sert à savoir ce qu'on achète : en montrer quatre
  // revenait à annoncer moins que ce qui est livré.
  socials: [
    { platform: 'GitHub', handle: 'namorama', url: 'https://github.com/namorama', status: 'free' },
    { platform: 'LinkedIn', handle: 'namorama', url: 'https://www.linkedin.com/company/namorama', status: 'free' },
    { platform: 'Telegram', handle: 'namorama', url: 'https://t.me/namorama', status: 'free' },
    { platform: 'TikTok', handle: 'namorama', url: 'https://www.tiktok.com/@namorama', status: 'taken' },
    { platform: 'X', handle: 'namorama', url: 'https://x.com/namorama', status: 'taken' },
    { platform: 'YouTube', handle: 'namorama', url: 'https://www.youtube.com/@namorama', status: 'free' },
  ],
  trademark: {
    office: 'INPI',
    match: 'none',
    hits: [],
    deepLink: 'https://data.inpi.fr/search?q=namorama&type=brands',
  },
  quality: {
    score: 82,
    scores: { memorability: 4, pronunciation: 4, international: 5, seo: 3, distinctiveness: 5 },
    strengths: 'Court, sonore, international et très distinctif.',
    watchout: 'Sens peu explicite : à soutenir par un logo et une accroche claire.',
  },
  score: 68,
  generatedAt: new Date().toISOString(),
  disclaimer:
    "Signal indicatif de disponibilité. Ne remplace pas une recherche d'antériorité ni l'avis d'un conseil en propriété industrielle.",
  };
