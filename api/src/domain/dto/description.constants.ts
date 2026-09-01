/**
 * Longueur de la description libre — un seul seuil, partagé.
 *
 * Il y en avait deux : 5 caractères pour les endpoints de l'étape 1 (reformuler,
 * mots-clés, contraintes, concurrents) et 10 pour la recherche. Une description
 * de 6 caractères franchissait donc toute l'étape 1, faisait travailler l'IA,
 * puis se heurtait au mur un écran plus loin — le refus arrivait après l'effort,
 * jamais avant. Observé en production le 27/08/2026 : trois requêtes refusées
 * d'affilée sur `/domain/search/stream` par un utilisateur qui venait de passer
 * l'étape précédente.
 *
 * Le front applique le même nombre (`DESCRIPTION_MIN_LENGTH` dans le wizard) :
 * le bouton reste inactif tant qu'il n'est pas atteint, avec le compte restant
 * affiché sous le champ.
 */
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 2000;

export const DESCRIPTION_MIN_MESSAGE = `La description doit faire au moins ${DESCRIPTION_MIN_LENGTH} caractères`;
export const DESCRIPTION_MAX_MESSAGE = `La description ne peut pas dépasser ${DESCRIPTION_MAX_LENGTH} caractères`;
