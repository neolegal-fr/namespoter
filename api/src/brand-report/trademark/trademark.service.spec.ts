import { TrademarkService } from './trademark.service';

/** Config sans identifiants → repli propre, aucune I/O réseau dans ces tests. */
const noConfig = { get: () => undefined } as any;
const noEvents = { event: () => {} } as any;

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
  });
});
