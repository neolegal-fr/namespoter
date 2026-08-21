import { DomainService } from './domain.service';

/**
 * Le pré-filtre DNS ne doit JAMAIS produire un « libre ».
 *
 * Un domaine délégué est enregistré : c'est la seule conclusion qu'on en tire.
 * Tout le reste — absence de délégation, panne du résolveur, registre qui
 * répond à tout — retourne au registre, qui reste seul juge.
 */
describe('DomainService — pré-filtre DNS', () => {
  function fabrique(resolveNs: (nom: string) => Promise<string[]>) {
    const service = Object.create(DomainService.prototype) as any;
    service.logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() };
    service.dnsResolver = { resolveNs: jest.fn((n: string) => resolveNs(n)) };
    service.dnsUtilisable = new Map();
    service.registryGates = new Map();
    service.probe = jest.fn().mockResolvedValue(true); // le registre dirait « libre »
    return service;
  }

  const TEMOIN = /^nm-temoin-/;

  it('déclare pris un domaine délégué, sans interroger le registre', async () => {
    const s = fabrique(async (n) => (TEMOIN.test(n) ? Promise.reject(new Error('NXDOMAIN')) as any : ['ns1.exemple.fr']));
    const compteur = { dns: 0, registre: 0 };
    await expect(s.isDomainAvailable('leboncoin.fr', compteur)).resolves.toBe(false);
    expect(s.probe).not.toHaveBeenCalled();
    expect(compteur).toEqual({ dns: 1, registre: 0 });
  });

  it('laisse le registre trancher quand il n’y a pas de délégation', async () => {
    const s = fabrique(async () => { throw new Error('NXDOMAIN'); });
    const compteur = { dns: 0, registre: 0 };
    await expect(s.isDomainAvailable('kalvira.fr', compteur)).resolves.toBe(true);
    expect(s.probe).toHaveBeenCalledWith('kalvira.fr');
    expect(compteur).toEqual({ dns: 0, registre: 1 });
  });

  it('laisse le registre trancher quand le résolveur est en panne', async () => {
    const s = fabrique(async () => { throw new Error('ETIMEOUT'); });
    await expect(s.isDomainAvailable('kalvira.fr')).resolves.toBe(true);
    expect(s.probe).toHaveBeenCalled();
  });

  it('se désactive sur un TLD qui répond à un nom inexistant (joker de zone)', async () => {
    // Le registre répond à TOUT, témoin compris : sans garde-fou, chaque
    // candidat ressortirait « pris » et la recherche ne rendrait plus rien.
    const s = fabrique(async () => ['ns1.joker.example']);
    await expect(s.isDomainAvailable('kalvira.cm')).resolves.toBe(true);
    expect(s.probe).toHaveBeenCalledWith('kalvira.cm');
    expect(s.logger.warn).toHaveBeenCalledWith(expect.stringContaining('joker de zone'));
  });

  it('ne teste le témoin qu’une fois par extension', async () => {
    const s = fabrique(async (n) => (TEMOIN.test(n) ? Promise.reject(new Error('NXDOMAIN')) as any : ['ns1.exemple.fr']));
    await s.isDomainAvailable('un.fr');
    await s.isDomainAvailable('deux.fr');
    await s.isDomainAvailable('trois.fr');
    const temoins = s.dnsResolver.resolveNs.mock.calls.filter((c: string[]) => TEMOIN.test(c[0]));
    expect(temoins).toHaveLength(1);
  });
});
