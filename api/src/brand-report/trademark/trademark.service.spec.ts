import { TrademarkService } from './trademark.service';

/** Config sans identifiants → repli propre, aucune I/O réseau dans ces tests. */
const noConfig = { get: () => undefined } as any;
/** Journal espionné : on vérifie que l'absence de configuration est SIGNALÉE. */
const makeEvents = () => {
  const events: string[] = [];
  const warnings: string[] = [];
  return {
    spy: { events, warnings },
    logger: { event: (n: string) => events.push(n), warn: (m: string) => warnings.push(m) } as any,
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
});
