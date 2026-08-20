import { dedupeKeywords, KEYWORD_LIMIT } from './domain.service';

describe('mots-clés proposés', () => {
  it('dédoublonne sans tenir compte de la casse ni des espaces', () => {
    expect(dedupeKeywords([' vélo ', 'Vélo', 'VÉLO', 'roue'])).toEqual(['vélo', 'roue']);
  });

  it("garde l'ordre du modèle — c'est l'ordre de pertinence", () => {
    expect(dedupeKeywords(['b', 'a', 'c'])).toEqual(['b', 'a', 'c']);
  });

  it('ignore les entrées vides laissées par une virgule finale', () => {
    expect(dedupeKeywords(['a', '', '  ', 'b'])).toEqual(['a', 'b']);
  });

  it('le plafond laisse de quoi couvrir plusieurs angles sans lasser', () => {
    expect(KEYWORD_LIMIT).toBe(15);
  });
});
