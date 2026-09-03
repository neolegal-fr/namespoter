import { TrademarkService } from './trademark.service';
import { NameVariantsService } from './name-variants.service';

/** Config sans identifiants → repli propre, aucune I/O réseau dans ces tests. */
const noConfig = { get: () => undefined } as any;
/** Journal espionné : on vérifie que l'absence de configuration est SIGNALÉE. */
const makeEvents = () => {
  const events: string[] = [];
  const warnings: string[] = [];
  const payloads: unknown[] = [];
  return {
    spy: { events, warnings, payloads },
    logger: {
      event: (n: string, d?: unknown) => { events.push(n); if (d !== undefined) payloads.push(d); },
      warn: (m: string) => warnings.push(m),
    } as any,
  };
};
const noEvents = makeEvents().logger;
/** Variantes neutres : ces tests portent sur le service de marques, pas sur le découpage. */
const noVariants = { variants: async () => [] } as any;

describe('TrademarkService', () => {
  const svc = new TrademarkService(noConfig, noEvents, noVariants) as any;

  describe('extractNiceClasses (notice ST66)', () => {
    it('extrait, déduplique et trie les classes', () => {
      const xml = `
        <ClassificationKindCode>Nice</ClassificationKindCode>
        <ClassDescriptionDetails>
          <ClassDescription><ClassNumber>38</ClassNumber></ClassDescription>
          <ClassDescription><ClassNumber>16</ClassNumber></ClassDescription>
          <ClassDescription><ClassNumber>16</ClassNumber></ClassDescription>
          <ClassDescription><ClassNumber>35</ClassNumber></ClassDescription>
        </ClassDescriptionDetails>`;
      expect(svc.extractNiceClasses(xml)).toEqual([16, 35, 38]);
    });

    it('ignore les numéros hors 1-45 et le XML sans classe', () => {
      expect(svc.extractNiceClasses('<ClassNumber>99</ClassNumber>')).toEqual([]);
      expect(svc.extractNiceClasses('<x>no class here</x>')).toEqual([]);
    });
  });

  describe('buildQuery (la requête envoyée à la passerelle)', () => {
    /*
     * Le cas qui a motivé le correctif : sans guillemets, `[Mark_Exp=neo legal]`
     * renvoyait 3818 dépôts sans rapport et PAS la marque « Neo Legal »
     * réellement homonyme — mesuré en production le 03/09/2026. Avec :
     * 1 résultat, le bon.
     */
    it('met le nom entre guillemets — un nom en plusieurs mots est une phrase, pas un OU', () => {
      expect(svc.buildQuery('neo legal')).toBe('[Mark_Exp="neo legal"]');
    });

    it('un nom en un seul mot passe par le même chemin', () => {
      expect(svc.buildQuery('Qonto')).toBe('[Mark_Exp="Qonto"]');
    });

    /*
     * Un guillemet laissé passer refermerait la phrase au milieu du nom : le
     * reste repartirait en OU, c'est-à-dire exactement le défaut corrigé ici.
     */
    it('neutralise ce qui refermerait la phrase ou casserait le DSL', () => {
      expect(svc.buildQuery('neo"legal')).toBe('[Mark_Exp="neo legal"]');
      expect(svc.buildQuery('[Mark=x]')).toBe('[Mark_Exp="Mark x"]');
      expect(svc.buildQuery('  neo   legal  ')).toBe('[Mark_Exp="neo legal"]');
    });
  });

  describe('check avec un nom inexploitable', () => {
    /*
     * `[Mark_Exp=""]` interroge le vide : sa réponse ne veut rien dire, et on
     * en tirerait un « aucun dépôt identique » rassurant sur du néant.
     */
    it("ne pose pas la question quand il ne reste rien du nom", async () => {
      // Identifiants présents : sans eux, le repli « non configurée » répondrait
      // en premier et ce garde-fou ne serait jamais atteint. Aucune I/O pour
      // autant — il rend la main avant l'authentification.
      const configured = { get: (k: string) => (k === 'INPI_USERNAME' ? 'u' : 'p') } as any;
      const r = await (new TrademarkService(configured, noEvents, noVariants) as any).check('[]=""');
      expect(r.match).toBe('unknown');
      expect(r.hits).toEqual([]);
      expect(r.note).toContain('inexploitable');
    });
  });

  describe('classify', () => {
    it('none quand aucun dépôt', () => expect(svc.classify('Qonto', [])).toBe('none'));
    it('exact quand un nom correspond (insensible à la casse/espaces)', () =>
      expect(svc.classify('Qonto', [{ name: ' qonto ', classes: [] }])).toBe('exact'));
    it('similar quand des dépôts existent sans correspondance exacte', () =>
      expect(svc.classify('Qonto', [{ name: 'Qontoo', classes: [] }])).toBe('similar'));
  });

  describe('proximity (à quelle distance se trouve un dépôt)', () => {
    it('exact : le même nom, casse et bordures en moins', () => {
      expect(svc.proximity('Qonto', ' qonto ')).toBe('exact');
    });

    /*
     * Le cas du 03/09/2026 : « Neo Legal » est déposé en classe 45, « neolegal »
     * ne le trouvait pas. Pour l'INPI, l'espace ne distingue pas deux marques.
     */
    it('normalized : le même nom à un espace, un tiret ou un accent près', () => {
      expect(svc.proximity('neolegal', 'Neo Legal')).toBe('normalized');
      expect(svc.proximity('neolegal', 'néo-légal')).toBe('normalized');
    });

    it('other : remonté par la recherche, sans correspondance de nom', () => {
      expect(svc.proximity('neolegal', 'bauer.legal')).toBe('other');
      expect(svc.proximity('Qonto', 'Qontoo')).toBe('other');
    });
  });

  describe('classify avec la hiérarchie', () => {
    /*
     * Faire tomber « Neo Legal » dans `similar` peindrait en orange ce qui
     * mérite du rouge — c'est le faux négatif qu'on corrige.
     */
    it("un même nom aux séparateurs près vaut un dépôt identique", () =>
      expect(svc.classify('neolegal', [{ name: 'Neo Legal', classes: [] }])).toBe('exact'));

    it('les dépôts sans correspondance restent similar', () =>
      expect(svc.classify('neolegal', [{ name: 'bauer.legal', classes: [] }])).toBe('similar'));
  });

  describe('check sans configuration INPI', () => {
    it('renvoie unknown + lien profond, sans appel réseau', async () => {
      const r = await svc.check('Qonto');
      expect(r.match).toBe('unknown');
      expect(r.hits).toEqual([]);
      expect(r.deepLink).toContain('data.inpi.fr');
      expect(r.office).toBe('INPI');
    });

    it('dit POURQUOI, dans le rapport et dans le journal', async () => {
      const { spy, logger } = makeEvents();
      const r = await (new TrademarkService(noConfig, logger, noVariants) as any).check('Qonto');

      // Dans le rapport : sans la note, une configuration absente et une panne
      // de l'INPI donnent le même écran.
      expect(r.note).toContain('non configurée');

      // Dans le journal : sinon la panne reste invisible côté exploitation,
      // alors que chaque rapport concerné est facturé.
      expect(spy.events).toContain('trademark_check_unconfigured');
      expect(spy.warnings).toHaveLength(1);
    });
  });

  describe('trackQuota (suivi du quota INPI)', () => {
    const fakeRes = (headers: Record<string, string>) =>
      ({ headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } }) as any;

    it("journalise le compteur et l'octet restant sur une recherche", () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger, noVariants) as any;
      svc2.trackQuota('https://api-gateway.inpi.fr/services/apidiffusion/api/marques/search',
        fakeRes({ 'x-rate-limit-remaining': '42', 'x-size-limit-remaining': '49994497' }));
      expect(spy.payloads).toEqual([{ endpoint: 'search', remaining: 42, bytesRemaining: 49994497 }]);
      expect(spy.warnings).toHaveLength(0);
    });

    it('distingue une notice d\'une recherche — elle coûte une unité aussi', () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger, noVariants) as any;
      svc2.trackQuota('https://api-gateway.inpi.fr/services/apidiffusion/api/marques/FR123/xml',
        fakeRes({ 'x-rate-limit-remaining': '41' }));
      expect(spy.payloads[0]).toEqual({ endpoint: 'notice', remaining: 41 });
    });

    it("ne journalise rien quand l'appel n'expose pas de quota (auth, login)", () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger, noVariants) as any;
      svc2.trackQuota('https://api-gateway.inpi.fr/auth/login', fakeRes({}));
      expect(spy.events).toEqual([]);
    });

    it('alerte sous le seuil : moins de deux rapports possibles', () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger, noVariants) as any;
      svc2.trackQuota('.../search', fakeRes({ 'x-rate-limit-remaining': '11' }));
      expect(spy.warnings).toHaveLength(1);
      expect(spy.warnings[0]).toContain('11');
    });
  });
});
