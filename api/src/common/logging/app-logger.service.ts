import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { appendFile, mkdir, readdir, unlink } from 'fs/promises';
import { join } from 'path';

/** Un événement de log, sérialisé en une ligne JSON (format NDJSON). */
export interface LogEvent {
  /** Type d'entrée : trace technique, requête HTTP, ou événement métier/parcours. */
  kind: 'log' | 'http' | 'event';
  level: 'error' | 'warn' | 'info' | 'debug';
  /** Composant émetteur (ex. « DomainService »), ou nom de l'événement métier. */
  context?: string;
  message?: string;
  [extra: string]: unknown;
}

/**
 * Journalisation structurée, persistée hors du conteneur.
 *
 * Pourquoi ne pas se contenter de stdout : `docker compose up -d` après un
 * `pull` **recrée** le conteneur, et le fichier json-file de Docker vit dans le
 * répertoire du conteneur — il disparaît donc à chaque déploiement. On écrit
 * aussi dans LOG_DIR, monté depuis l'hôte, pour garder un historique
 * exploitable après mise à jour.
 *
 * Format NDJSON : une ligne = un objet JSON. Lisible par `jq`, importable dans
 * n'importe quel outil, et grepable à la main sans dépendance.
 */
@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly dir = process.env.LOG_DIR ?? '';
  private readonly retentionDays = Number(process.env.LOG_RETENTION_DAYS ?? 30);
  /** Écriture fichier désactivée si LOG_DIR n'est pas défini (dev local). */
  private readonly toFile = this.dir.length > 0;
  private ready: Promise<void>;
  /** Sérialise les écritures : évite d'entrelacer deux lignes NDJSON. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    if (!this.toFile) return;
    try {
      await mkdir(this.dir, { recursive: true });
      await this.purgeOldFiles();
      // Purge quotidienne : le conteneur tourne en continu, un seul timer suffit.
      setInterval(() => void this.purgeOldFiles(), 24 * 60 * 60 * 1000).unref();
    } catch (err) {
      console.error('[AppLogger] initialisation impossible, repli sur stdout seul', err);
    }
  }

  /** Supprime les fichiers dépassant la rétention, pour ne pas saturer le disque. */
  private async purgeOldFiles(): Promise<void> {
    try {
      const limit = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
      for (const name of await readdir(this.dir)) {
        const match = /^app-(\d{4}-\d{2}-\d{2})\.ndjson$/.exec(name);
        if (!match) continue;
        if (new Date(match[1]).getTime() < limit) {
          await unlink(join(this.dir, name));
        }
      }
    } catch {
      /* purge best-effort : ne doit jamais interrompre le service */
    }
  }

  /** Écrit une entrée structurée. N'échoue jamais : un log ne casse pas une requête. */
  write(entry: LogEvent): void {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });

    // stdout reste alimenté : `docker logs` et les outils d'agrégation en vivent.
    if (entry.level === 'error') console.error(line);
    else console.log(line);

    if (!this.toFile) return;
    const file = join(this.dir, `app-${new Date().toISOString().slice(0, 10)}.ndjson`);
    this.queue = this.queue
      .then(() => this.ready)
      .then(() => appendFile(file, line + '\n'))
      .catch(() => { /* disque plein, droits… : on continue sur stdout */ });
  }

  /** Événement métier ou étape de parcours utilisateur. */
  event(name: string, data: Record<string, unknown> = {}): void {
    this.write({ kind: 'event', level: 'info', context: name, ...data });
  }

  // ─── Interface LoggerService de Nest ───────────────────────
  log(message: any, context?: string) {
    this.write({ kind: 'log', level: 'info', context, message: String(message) });
  }

  error(message: any, stack?: string, context?: string) {
    this.write({ kind: 'log', level: 'error', context, message: String(message), stack });
  }

  warn(message: any, context?: string) {
    this.write({ kind: 'log', level: 'warn', context, message: String(message) });
  }

  debug(message: any, context?: string) {
    this.write({ kind: 'log', level: 'debug', context, message: String(message) });
  }

  /**
   * Volontairement muet. nest-keycloak-connect journalise en `verbose` le JWT
   * complet et le contenu du token à chaque requête : un jeton en clair dans
   * les logs est rejouable jusqu'à son expiration. On ne le relaie donc jamais.
   */
  verbose(_message: any, _context?: string) {}

  setLogLevels?(_levels: LogLevel[]) {}
}
