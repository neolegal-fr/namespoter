import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
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

  /** Clés (noms normalisés) des rapports déjà générés par ce compte. */
  async listNames(keycloakId: string): Promise<string[]> {
    const rows = await this.repo.find({ where: { keycloakId }, select: { nameKey: true } });
    return rows.map((r) => r.nameKey);
  }

  /** Rapport partagé publiquement via son jeton, ou `null`. */
  async findByToken(token: string): Promise<BrandReport | null> {
    if (!token) return null;
    const row = await this.repo.findOne({ where: { shareToken: token } });
    return row?.report ?? null;
  }

  /**
   * Mémorise (ou met à jour) le rapport pour ce (compte, nom). Garantit un jeton
   * de partage stable, embarqué dans le rapport renvoyé.
   */
  async save(keycloakId: string, name: string, report: BrandReport): Promise<void> {
    const nameKey = this.key(name);
    const existing = await this.repo.findOne({ where: { keycloakId, nameKey } });
    const shareToken = existing?.shareToken ?? randomUUID();
    report.shareToken = shareToken;
    if (existing) {
      existing.report = report;
      existing.name = name;
      existing.shareToken = shareToken;
      await this.repo.save(existing);
    } else {
      await this.repo.save(this.repo.create({ keycloakId, nameKey, name, report, shareToken }));
    }
  }
}
