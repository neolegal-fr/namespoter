import { UsersService, currentPeriod } from './users.service';

/**
 * Règle du rapport offert : un par mois CALENDAIRE, non cumulable, bascule
 * calculée à la lecture. Testée sur la méthode pure, sans base.
 */
describe('UsersService.isFreeReportAvailable — bascule de période', () => {
  const svc = new UsersService({} as any, {} as any, {} as any);
  const aug = new Date(2026, 7, 19, 12, 0, 0); // 19 août 2026

  it('currentPeriod est au format AAAA-MM, mois sur deux chiffres', () => {
    expect(currentPeriod(new Date(2026, 0, 5))).toBe('2026-01');
    expect(currentPeriod(aug)).toBe('2026-08');
    expect(currentPeriod(new Date(2026, 11, 31))).toBe('2026-12');
  });

  it('disponible pour un compte qui n\'a jamais consommé', () => {
    expect(svc.isFreeReportAvailable({ freeReportPeriod: null, freeReportUsedAt: null }, aug)).toBe(true);
  });

  it('indisponible une fois consommé dans le mois courant', () => {
    expect(svc.isFreeReportAvailable({ freeReportPeriod: '2026-08', freeReportUsedAt: new Date(2026, 7, 2) }, aug)).toBe(false);
  });

  it('redevient disponible le mois suivant — sans aucune tâche planifiée', () => {
    const sept = new Date(2026, 8, 1, 0, 0, 1);
    expect(svc.isFreeReportAvailable({ freeReportPeriod: '2026-08', freeReportUsedAt: new Date(2026, 7, 30) }, sept)).toBe(true);
  });

  it('non cumulable : un mois sauté ne donne pas deux droits', () => {
    // Consommé en juin, rien en juillet : en août il n'y a qu'UN droit, pas deux.
    const u = { freeReportPeriod: '2026-06', freeReportUsedAt: new Date(2026, 5, 10) };
    expect(svc.isFreeReportAvailable(u, aug)).toBe(true);
    // …et une fois consommé en août, plus rien.
    expect(svc.isFreeReportAvailable({ freeReportPeriod: '2026-08', freeReportUsedAt: aug }, aug)).toBe(false);
  });

  it('la frontière est le changement de mois, pas 30 jours glissants', () => {
    // Consommé le 31 juillet à 23h59 → disponible le 1er août à 00h00.
    const u = { freeReportPeriod: '2026-07', freeReportUsedAt: new Date(2026, 6, 31, 23, 59) };
    expect(svc.isFreeReportAvailable(u, new Date(2026, 7, 1, 0, 0))).toBe(true);
  });
});
