import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Trois états, pas deux. « system » est l'ABSENCE de valeur stockée. */
export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'nm-theme';

/**
 * Thème clair / sombre / système.
 *
 * Une bascule à deux états force un choix, puis cesse de suivre l'OS quand
 * celui-ci passe en mode nuit le soir. D'où le troisième état, et d'où le fait
 * de ne JAMAIS stocker le mode résolu : on stocke le choix, ou rien.
 *
 * L'attribut est posé sur `<html>` — le même que celui lu par le script
 * synchrone de `index.html`, et le même que celui donné à PrimeNG
 * (`darkModeSelector`), sinon deux thèmes se superposent.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly choice = signal<ThemeChoice>('system');
  /** Mode réellement appliqué, choix « système » résolu. */
  readonly resolved = signal<'light' | 'dark'>('light');

  constructor() {
    if (!this.isBrowser) return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch { /* stockage bloqué */ }
    this.choice.set(stored === 'light' || stored === 'dark' ? stored : 'system');
    this.apply();

    // L'OS bascule le soir : une page déjà ouverte doit suivre, sans rechargement.
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => { if (this.choice() === 'system') this.apply(); });
  }

  set(choice: ThemeChoice): void {
    this.choice.set(choice);
    if (!this.isBrowser) return;
    try {
      if (choice === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, choice);
    } catch { /* stockage bloqué : le choix vaut pour la session */ }
    this.apply();
  }

  /**
   * L'attribut porte toujours le mode RÉSOLU — deux valeurs — quand le
   * stockage porte le CHOIX, à trois états. PrimeNG ne sait basculer que sur
   * un sélecteur : en mode système avec OS sombre, sans attribut, ses
   * composants resteraient clairs au milieu d'une interface sombre.
   */
  private apply(): void {
    const c = this.choice();
    const dark = c === 'dark' || (c === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    this.resolved.set(dark ? 'dark' : 'light');
  }
}
