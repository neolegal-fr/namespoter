import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandReportRecord } from './entities/brand-report-record.entity';
import type { BrandReport } from './dto/brand-report.types';

/** Persistance des rapports générés (cache par utilisateur + nom). */
@Injectable()
export class BrandReportStore {
  constructor(
    @InjectRepository(BrandReportRecord)
    private readonly repo: Repository<BrandReportRecord>,
  ) {}

  private key(name: string): string {
    return name.trim().toLowerCase();
  }

  /** Rapport déjà généré pour ce (compte, nom), ou `null`. */
  async find(keycloakId: string, name: string): Promise<BrandReport | null> {
    const row = await this.repo.findOne({ where: { keycloakId, nameKey: this.key(name) } });
    return row?.report ?? null;
  }

  /** Mémorise (ou met à jour) le rapport pour ce (compte, nom). */
  async save(keycloakId: string, name: string, report: BrandReport): Promise<void> {
    const nameKey = this.key(name);
    const existing = await this.repo.findOne({ where: { keycloakId, nameKey } });
    if (existing) {
      existing.report = report;
      existing.name = name;
      await this.repo.save(existing);
    } else {
      await this.repo.save(this.repo.create({ keycloakId, nameKey, name, report }));
    }
  }
}
