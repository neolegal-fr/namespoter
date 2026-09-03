import { NameVariantsService } from './name-variants.service';

const config = { get: () => undefined } as any;

/** Remplace le client OpenAI : ces tests ne sortent pas de la machine. */
const withModel = (reply: unknown) => {
  const svc = new NameVariantsService(config);
  (svc as any).openai = {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content: JSON.stringify(reply) } }] }),
      },
    },
  };
  return svc;
};

describe('NameVariantsService', () => {
  const svc = new NameVariantsService(config);

  describe('variantes mécaniques — gratuites, sans appel au modèle', () => {
    it('un nom écrit avec un espace cherche aussi sa forme collée', async () => {
      await expect(svc.variants('Neo Legal')).resolves.toEqual(['NeoLegal']);
    });

    it('un tiret ouvre les deux formes', async () => {
      await expect(svc.variants('neo-legal')).resolves.toEqual(['neolegal', 'neo legal']);
    });

    /*
     * Cinq lettres : « Qonto » n'est pas un mot-valise. Le découper coûterait
     * une unité de quota pour du bruit.
     */
    it('un mot court ne déclenche aucun découpage', async () => {
      await expect(svc.variants('Qonto')).resolves.toEqual([]);
    });
  });

  describe('découpage par le modèle', () => {
    /*
     * Le cas du 03/09/2026 : « Neo Legal » est déposé, « neolegal » ne le
     * trouvait pas — l'index range « Neo Legal » en deux jetons.
     */
    it('propose le découpage en mots réels', async () => {
      const s = withModel({ decoupages: ['neo legal'] });
      await expect(s.variants('neolegal')).resolves.toEqual(['neo legal']);
    });

    /*
     * Le garde-fou qui rend l'étape sûre : le modèle peut se tromper, il ne
     * peut pas nous faire chercher un AUTRE nom et le présenter comme celui de
     * l'utilisateur.
     */
    it('rejette tout découpage qui ne redonne pas le nom exact', async () => {
      const s = withModel({ decoupages: ['neo legale', 'neo law', 'neo legal'] });
      await expect(s.variants('neolegal')).resolves.toEqual(['neo legal']);
    });

    it('une réponse inutilisable ne casse rien', async () => {
      const s = withModel({ autre: 'chose' });
      await expect(s.variants('neolegal')).resolves.toEqual([]);
    });

    it('une panne du modèle ne casse rien non plus', async () => {
      const s = new NameVariantsService(config);
      (s as any).openai = { chat: { completions: { create: async () => { throw new Error('coupé'); } } } };
      await expect(s.variants('neolegal')).resolves.toEqual([]);
    });
  });
});
