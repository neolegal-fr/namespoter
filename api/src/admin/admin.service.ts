import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { DomainSuggestion } from '../projects/entities/domain-suggestion.entity';
import { CreditAdjustment } from './entities/credit-adjustment.entity';
import { BrandReportRecord } from '../brand-report/entities/brand-report-record.entity';

export interface AdminUserRow {
  id: number;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  credits: number;
  extraCredits: number;
  totalCredits: number;
  createdAt: Date;
  lastLogin: Date | null;
  projectCount: number;
  /**
   * Rapports de marque produits pour ce compte. Compte les rapports réellement
   * générés (un par nom distinct) : une demande bloquée faute de crédits ou en
   * échec n'y figure pas — seuls les logs les voient (`brand_report_requested`).
   */
  brandReportCount: number;
}

export interface AdminStats {
  totalUsers: number;
  periodActiveUsers: number;
  periodNewUsers: number;
  periodNewProjects: number;
  periodSuggestions: number;
  periodBrandReports: number;
  totalProjects: number;
  totalSuggestions: number;
  totalBrandReports: number;
  avgSuggestionsPerProject: number;
  avgFavoritesPerProject: number;
  totalFreeCredits: number;
  totalPackCredits: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(DomainSuggestion) private suggestionRepo: Repository<DomainSuggestion>,
    @InjectRepository(CreditAdjustment) private adjustmentRepo: Repository<CreditAdjustment>,
    @InjectRepository(BrandReportRecord) private brandReportRepo: Repository<BrandReportRecord>,
    private dataSource: DataSource,
  ) {}

  /**
   * Nombre de rapports de marque par compte, pour une page d'utilisateurs.
   *
   * `BrandReportRecord` n'a pas de relation TypeORM vers `User` (il ne porte que
   * le `sub` Keycloak) : `loadRelationCountAndMap` ne s'applique donc pas, d'où
   * cette agrégation en une requête pour toute la page — et non une par ligne.
   */
  private async brandReportCounts(keycloakIds: string[]): Promise<Map<string, number>> {
    if (!keycloakIds.length) return new Map();
    const rows = await this.brandReportRepo.createQueryBuilder('r')
      .select('r.keycloakId', 'keycloakId')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.keycloakId IN (:...ids)', { ids: keycloakIds })
      .groupBy('r.keycloakId')
      .getRawMany<{ keycloakId: string; cnt: string }>();
    return new Map(rows.map((r) => [r.keycloakId, Number(r.cnt)]));
  }

  /**
   * Nombre de projets par compte, pour une page d'utilisateurs.
   *
   * TypeORM 1.x a retiré `loadRelationCountAndMap`, qui portait ce décompte.
   * Même agrégation groupée que {@link brandReportCounts} : une requête pour
   * toute la page, et non une par ligne.
   */
  private async projectCounts(userIds: number[]): Promise<Map<number, number>> {
    if (!userIds.length) return new Map();
    const rows = await this.projectRepo.createQueryBuilder('p')
      .select('u.id', 'userId')
      .addSelect('COUNT(*)', 'cnt')
      .innerJoin('p.user', 'u')
      .where('u.id IN (:...ids)', { ids: userIds })
      .groupBy('u.id')
      .getRawMany<{ userId: number; cnt: string }>();
    return new Map(rows.map((r) => [Number(r.userId), Number(r.cnt)]));
  }

  async getUsers(page: number, limit: number, search: string): Promise<{ data: AdminUserRow[]; total: number }> {
    const qb = this.userRepo.createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('u.email LIKE :search', { search: `%${search}%` });
    }

    const [users, total] = await qb.getManyAndCount();
    const [reportCounts, projCounts] = await Promise.all([
      this.brandReportCounts(users.map((u) => u.keycloakId)),
      this.projectCounts(users.map((u) => u.id)),
    ]);

    const data: AdminUserRow[] = users.map((u: any) => ({
      id: u.id,
      keycloakId: u.keycloakId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      credits: u.credits,
      extraCredits: u.extraCredits,
      totalCredits: u.credits + u.extraCredits,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      projectCount: projCounts.get(u.id) ?? 0,
      brandReportCount: reportCounts.get(u.keycloakId) ?? 0,
    }));

    return { data, total };
  }

  async adjustCredits(userId: number, delta: number, reason: string, adminSub: string): Promise<AdminUserRow> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Appliquer le delta sur extraCredits (crédits permanents)
    user.extraCredits = Math.max(0, user.extraCredits + delta);
    await this.userRepo.save(user);

    // Enregistrer l'ajustement pour audit
    const adjustment = this.adjustmentRepo.create({ userId, delta, reason, adminSub });
    await this.adjustmentRepo.save(adjustment);

    return {
      id: user.id,
      keycloakId: user.keycloakId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      credits: user.credits,
      extraCredits: user.extraCredits,
      totalCredits: user.credits + user.extraCredits,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      projectCount: await this.projectRepo.count({ where: { user: { id: userId } } }),
      brandReportCount: await this.brandReportRepo.count({ where: { keycloakId: user.keycloakId } }),
    };
  }

  async getStats(from?: Date, to?: Date): Promise<AdminStats> {
    const periodEnd = to ?? new Date();
    const periodStart = from ?? new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Les comptes admin servent à tester et à faire des démonstrations : leur
    // activité gonflerait chaque agrégat sans rien dire de l'usage réel. Ils
    // sont donc écartés de bout en bout — utilisateurs, projets, suggestions
    // et crédits — et pas seulement du décompte d'utilisateurs.
    const [totalUsers, periodActiveUsers, periodNewUsers, periodNewProjects, periodBrandReports] = await Promise.all([
      this.userRepo.count({ where: { isAdmin: false } }),
      this.userRepo.createQueryBuilder('u')
        .where('u.lastLogin >= :from AND u.lastLogin <= :to', { from: periodStart, to: periodEnd })
        .andWhere('u.isAdmin = false')
        .getCount(),
      this.userRepo.createQueryBuilder('u')
        .where('u.createdAt >= :from AND u.createdAt <= :to', { from: periodStart, to: periodEnd })
        .andWhere('u.isAdmin = false')
        .getCount(),
      this.projectRepo.createQueryBuilder('p')
        .innerJoin('p.user', 'u')
        .where('p.createdAt >= :from AND p.createdAt <= :to', { from: periodStart, to: periodEnd })
        .andWhere('u.isAdmin = false')
        .getCount(),
      // Jointure sur le `sub` Keycloak : BrandReportRecord ne référence pas
      // `user.id`. L'`innerJoin` écarte au passage les rapports orphelins
      // (compte supprimé), qu'il serait trompeur de compter dans l'usage.
      this.brandReportRepo.createQueryBuilder('r')
        .innerJoin(User, 'u', 'u.keycloakId = r.keycloakId')
        .where('r.createdAt >= :from AND r.createdAt <= :to', { from: periodStart, to: periodEnd })
        .andWhere('u.isAdmin = false')
        .getCount(),
    ]);

    const periodSuggestionsResult = await this.dataSource.query(
      `SELECT COUNT(*) as cnt FROM domain_suggestion ds
       INNER JOIN project p ON p.id = ds.projectId
       INNER JOIN user u ON u.id = p.userId
       WHERE p.createdAt >= ? AND p.createdAt <= ? AND u.isAdmin = false`,
      [periodStart, periodEnd],
    );
    const periodSuggestions = Number(periodSuggestionsResult[0]?.cnt ?? 0);

    const [totalProjects, totalSuggestions, totalBrandReports] = await Promise.all([
      this.projectRepo.createQueryBuilder('p')
        .innerJoin('p.user', 'u')
        .where('u.isAdmin = false')
        .getCount(),
      this.suggestionRepo.createQueryBuilder('ds')
        .innerJoin('ds.project', 'p')
        .innerJoin('p.user', 'u')
        .where('u.isAdmin = false')
        .getCount(),
      this.brandReportRepo.createQueryBuilder('r')
        .innerJoin(User, 'u', 'u.keycloakId = r.keycloakId')
        .where('u.isAdmin = false')
        .getCount(),
    ]);

    const avgSuggestionsResult = await this.dataSource.query(
      `SELECT AVG(cnt) as avg FROM (
         SELECT COUNT(*) as cnt FROM domain_suggestion ds
         INNER JOIN project p ON p.id = ds.projectId
         INNER JOIN user u ON u.id = p.userId
         WHERE u.isAdmin = false
         GROUP BY ds.projectId) sub`
    );
    const avgFavoritesResult = await this.dataSource.query(
      `SELECT AVG(cnt) as avg FROM (
         SELECT COUNT(*) as cnt FROM domain_suggestion ds
         INNER JOIN project p ON p.id = ds.projectId
         INNER JOIN user u ON u.id = p.userId
         WHERE ds.rating = 'liked' AND u.isAdmin = false
         GROUP BY ds.projectId) sub`
    );

    const creditsResult = await this.dataSource.query(
      `SELECT SUM(credits) as free, SUM(extraCredits) as pack FROM user WHERE isAdmin = false`
    );

    return {
      totalUsers,
      periodActiveUsers,
      periodNewUsers,
      periodNewProjects,
      periodSuggestions,
      periodBrandReports,
      totalProjects,
      totalSuggestions,
      totalBrandReports,
      avgSuggestionsPerProject: Math.round((avgSuggestionsResult[0]?.avg ?? 0) * 10) / 10,
      avgFavoritesPerProject: Math.round((avgFavoritesResult[0]?.avg ?? 0) * 10) / 10,
      totalFreeCredits: creditsResult[0]?.free ?? 0,
      totalPackCredits: creditsResult[0]?.pack ?? 0,
    };
  }
}
