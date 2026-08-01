import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  apiUrl = 'http://localhost:3000';
  keycloakUrl = 'http://localhost:8080';

  async load(): Promise<void> {
    try {
      // Chemin ABSOLU, impérativement. En relatif, « ./assets/config.json » se
      // résout contre l'URL courante : depuis /guides/xxx ou /projects/:id, la
      // requête partait vers /guides/assets/config.json, où le fallback SPA de
      // nginx renvoie index.html — avec un code 200, donc `res.ok` était vrai,
      // puis `res.json()` échouait sur du HTML. Le catch retombait alors sur les
      // valeurs par défaut, c'est-à-dire localhost… en production. Un visiteur
      // arrivant de Google sur un guide se retrouvait avec une application dont
      // l'API et Keycloak pointaient dans le vide, pour toute la session.
      const res = await fetch('/assets/config.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('json')) throw new Error(`type inattendu : ${type}`);

      const cfg = await res.json();
      if (cfg.apiUrl) this.apiUrl = cfg.apiUrl;
      if (cfg.keycloakUrl) this.keycloakUrl = cfg.keycloakUrl;
    } catch (err) {
      // Échec bruyant : sans configuration, l'application ne peut joindre ni
      // l'API ni Keycloak. Mieux vaut une trace en console qu'un repli muet
      // sur localhost, impossible à diagnostiquer côté utilisateur.
      console.error('[Config] chargement impossible, valeurs par défaut conservées', err);
    }
  }
}
