import { TrademarkService } from './trademark.service';

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

describe('TrademarkService', () => {
  const svc = new TrademarkService(noConfig, noEvents) as any;

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

  describe('classify', () => {
    it('none quand aucun dépôt', () => expect(svc.classify('Qonto', [])).toBe('none'));
    it('exact quand un nom correspond (insensible à la casse/espaces)', () =>
      expect(svc.classify('Qonto', [{ name: ' qonto ', classes: [] }])).toBe('exact'));
    it('similar quand des dépôts existent sans correspondance exacte', () =>
      expect(svc.classify('Qonto', [{ name: 'Qontoo', classes: [] }])).toBe('similar'));
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
      const r = await (new TrademarkService(noConfig, logger) as any).check('Qonto');

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
      const svc2 = new TrademarkService(noConfig, logger) as any;
      svc2.trackQuota('https://api-gateway.inpi.fr/services/apidiffusion/api/marques/search',
        fakeRes({ 'x-rate-limit-remaining': '42', 'x-size-limit-remaining': '49994497' }));
      expect(spy.payloads).toEqual([{ endpoint: 'search', remaining: 42, bytesRemaining: 49994497 }]);
      expect(spy.warnings).toHaveLength(0);
    });

    it('distingue une notice d\'une recherche — elle coûte une unité aussi', () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger) as any;
      svc2.trackQuota('https://api-gateway.inpi.fr/services/apidiffusion/api/marques/FR123/xml',
        fakeRes({ 'x-rate-limit-remaining': '41' }));
      expect(spy.payloads[0]).toEqual({ endpoint: 'notice', remaining: 41 });
    });

    it("ne journalise rien quand l'appel n'expose pas de quota (auth, login)", () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger) as any;
      svc2.trackQuota('https://api-gateway.inpi.fr/auth/login', fakeRes({}));
      expect(spy.events).toEqual([]);
    });

    it('alerte sous le seuil : moins de deux rapports possibles', () => {
      const { spy, logger } = makeEvents();
      const svc2 = new TrademarkService(noConfig, logger) as any;
      svc2.trackQuota('.../search', fakeRes({ 'x-rate-limit-remaining': '11' }));
      expect(spy.warnings).toHaveLength(1);
      expect(spy.warnings[0]).toContain('11');
    });
  });
});
