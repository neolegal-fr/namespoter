import { ForbiddenException } from '@nestjs/common';
import { BrandReportController } from './brand-report.controller';
import { BRAND_REPORT_COST } from './brand-report.service';

describe('BrandReportController — crédits (US-052)', () => {
  const dto = { name: 'Qonto' } as any;
  const user = { sub: 'kc-123' };

  function make(opts: { totalCredits: number; newTotal?: number }) {
    const generate = jest.fn().mockResolvedValue({ name: 'Qonto', score: 80 });
    const decrementCredits = jest.fn().mockResolvedValue(opts.newTotal ?? 0);
    const findOrCreate = jest.fn().mockResolvedValue({ totalCredits: opts.totalCredits });
    const event = jest.fn();
    // transaction(cb) exécute simplement le callback avec un manager factice.
    const dataSource = { transaction: (cb: any) => cb({}) } as any;
    const sendReport = jest.fn().mockResolvedValue(true);
    const ctrl = new BrandReportController(
      { generate } as any,
      { sendReport } as any,
      { findOrCreate, decrementCredits } as any,
      dataSource,
      { event } as any,
    );
    return { ctrl, generate, decrementCredits, event, sendReport };
  }

  it('bloque et ne génère pas si crédits < coût', async () => {
    const { ctrl, generate, event } = make({ totalCredits: BRAND_REPORT_COST - 1 });
    await expect(ctrl.full(dto, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(generate).not.toHaveBeenCalled();
    expect(event).toHaveBeenCalledWith('brand_report_blocked_no_credits', expect.any(Object));
  });

  it('génère puis débite le coût, et renvoie les crédits restants', async () => {
    const { ctrl, generate, decrementCredits, event, sendReport } = make({ totalCredits: 500, newTotal: 200 });
    const res: any = await ctrl.full(dto, user);
    expect(generate).toHaveBeenCalledWith('Qonto', { extensions: undefined });
    expect(decrementCredits).toHaveBeenCalledWith('kc-123', BRAND_REPORT_COST, expect.anything());
    expect(res.remainingCredits).toBe(200);
    expect(res.score).toBe(80);
    expect(res.emailed).toBe(true);
    expect(sendReport).toHaveBeenCalled();
    expect(event).toHaveBeenCalledWith('brand_report_generated', expect.objectContaining({ cost: BRAND_REPORT_COST }));
  });

  it('annule si les crédits deviennent insuffisants au moment du débit (course)', async () => {
    const { ctrl } = make({ totalCredits: 500, newTotal: -1 });
    await expect(ctrl.full(dto, user)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
