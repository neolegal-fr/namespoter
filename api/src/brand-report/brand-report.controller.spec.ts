import { ForbiddenException } from '@nestjs/common';
import { BrandReportController } from './brand-report.controller';
import { BRAND_REPORT_COST } from './brand-report.service';

describe('BrandReportController — crédits (US-052)', () => {
  const dto = { name: 'Qonto' } as any;
  const user = { sub: 'kc-123', email: 'me@example.com' };

  function make(opts: { totalCredits: number; newTotal?: number }) {
    const generate = jest.fn().mockResolvedValue({ name: 'Qonto', score: 80 });
    const decrementCredits = jest.fn().mockResolvedValue(opts.newTotal ?? 0);
    const findOrCreate = jest.fn().mockResolvedValue({ totalCredits: opts.totalCredits });
    const event = jest.fn();
    // transaction(cb) exécute simplement le callback avec un manager factice.
    const dataSource = { transaction: (cb: any) => cb({}) } as any;
    const sendReport = jest.fn().mockResolvedValue(true);
    const find = jest.fn().mockResolvedValue(null); // pas de rapport en cache par défaut
    const save = jest.fn().mockResolvedValue(undefined);
    const ctrl = new BrandReportController(
      { generate } as any,
      { find, save } as any,
      { sendReport } as any,
      { findOrCreate, decrementCredits } as any,
      dataSource,
      { event } as any,
    );
    return { ctrl, generate, decrementCredits, event, sendReport, find, save };
  }

  it('bloque et ne génère pas si crédits < coût', async () => {
    const { ctrl, generate, event } = make({ totalCredits: BRAND_REPORT_COST - 1 });
    await expect(ctrl.full(dto, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(generate).not.toHaveBeenCalled();
    expect(event).toHaveBeenCalledWith('brand_report_blocked_no_credits', expect.any(Object));
  });

  it('ne débite pas et renvoie le rapport en cache s\'il existe déjà', async () => {
    const { ctrl, generate, decrementCredits, find } = make({ totalCredits: BRAND_REPORT_COST * 2 });
    find.mockResolvedValue({ name: 'Qonto', score: 90 });
    const res: any = await ctrl.full(dto, user);
    expect(res.cached).toBe(true);
    expect(res.score).toBe(90);
    expect(generate).not.toHaveBeenCalled();
    expect(decrementCredits).not.toHaveBeenCalled();
  });

  it('génère puis débite le coût, et renvoie les crédits restants', async () => {
    const { ctrl, generate, decrementCredits, event, sendReport, save } = make({ totalCredits: BRAND_REPORT_COST * 2, newTotal: 200 });
    const res: any = await ctrl.full(dto, user);
    expect(generate).toHaveBeenCalledWith('Qonto', { extensions: undefined, withQuality: true });
    expect(save).toHaveBeenCalled();
    expect(decrementCredits).toHaveBeenCalledWith('kc-123', BRAND_REPORT_COST, expect.anything());
    expect(res.remainingCredits).toBe(200);
    expect(res.score).toBe(80);
    expect(res.emailed).toBe(true);
    expect(sendReport).toHaveBeenCalled();
    expect(event).toHaveBeenCalledWith('brand_report_generated', expect.objectContaining({ cost: BRAND_REPORT_COST }));
  });

  it('annule si les crédits deviennent insuffisants au moment du débit (course)', async () => {
    const { ctrl } = make({ totalCredits: BRAND_REPORT_COST * 2, newTotal: -1 });
    await expect(ctrl.full(dto, user)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('BrandReportController — traçage des demandes', () => {
  const dto = { name: 'Qonto' } as any;
  const user = { sub: 'kc-123', email: 'me@example.com' };

  function make(opts: { totalCredits: number; generate?: jest.Mock; find?: jest.Mock }) {
    const generate = opts.generate ?? jest.fn().mockResolvedValue({ name: 'Qonto', score: 80 });
    const find = opts.find ?? jest.fn().mockResolvedValue(null);
    const event = jest.fn();
    const ctrl = new BrandReportController(
      { generate } as any,
      { find, save: jest.fn().mockResolvedValue(undefined) } as any,
      { sendReport: jest.fn().mockResolvedValue(true) } as any,
      {
        findOrCreate: jest.fn().mockResolvedValue({ totalCredits: opts.totalCredits }),
        decrementCredits: jest.fn().mockResolvedValue(0),
      } as any,
      { transaction: (cb: any) => cb({}) } as any,
      { event } as any,
    );
    return { ctrl, event };
  }

  /** La demande est comptée quelle que soit son issue — sinon l'usage réel est sous-estimé. */
  it('émet brand_report_requested avant tout traitement', async () => {
    const { ctrl, event } = make({ totalCredits: BRAND_REPORT_COST * 2 });
    await ctrl.full(dto, user);
    expect(event).toHaveBeenNthCalledWith(1, 'brand_report_requested', {
      sub: 'kc-123',
      cost: BRAND_REPORT_COST,
      forced: false,
    });
  });

  it('émet brand_report_requested même quand la demande est bloquée faute de crédits', async () => {
    const { ctrl, event } = make({ totalCredits: BRAND_REPORT_COST - 1 });
    await expect(ctrl.full(dto, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(event).toHaveBeenNthCalledWith(1, 'brand_report_requested', expect.any(Object));
    expect(event).toHaveBeenCalledWith('brand_report_blocked_no_credits', expect.any(Object));
  });

  it('émet brand_report_requested même quand le rapport vient du cache', async () => {
    const { ctrl, event } = make({
      totalCredits: BRAND_REPORT_COST * 2,
      find: jest.fn().mockResolvedValue({ name: 'Qonto', score: 90 }),
    });
    await ctrl.full(dto, user);
    expect(event).toHaveBeenNthCalledWith(1, 'brand_report_requested', expect.any(Object));
    expect(event).toHaveBeenCalledWith('brand_report_cache_hit', expect.any(Object));
  });

  it('marque forced quand la régénération est forcée', async () => {
    const { ctrl, event } = make({ totalCredits: BRAND_REPORT_COST * 2 });
    await ctrl.full({ name: 'Qonto', force: true } as any, user);
    expect(event).toHaveBeenNthCalledWith(1, 'brand_report_requested',
      expect.objectContaining({ forced: true }));
  });

  /** Un échec ne débite rien : sans cet événement, l'écart demandes/rapports est inexpliqué. */
  it('émet brand_report_failed et propage l\'erreur si la génération échoue', async () => {
    const { ctrl, event } = make({
      totalCredits: BRAND_REPORT_COST * 2,
      generate: jest.fn().mockRejectedValue(new Error('INPI injoignable')),
    });
    await expect(ctrl.full(dto, user)).rejects.toThrow('INPI injoignable');
    expect(event).toHaveBeenCalledWith('brand_report_failed',
      expect.objectContaining({ sub: 'kc-123', reason: 'INPI injoignable' }));
    expect(event).not.toHaveBeenCalledWith('brand_report_generated', expect.anything());
  });
});
