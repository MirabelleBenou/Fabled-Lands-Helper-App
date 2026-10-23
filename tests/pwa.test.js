// Lot v0.2 — tests de l'installation et des mises à jour : etatInstallation et issueVerification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { etatInstallation, issueVerification } from '../js/pwa.js';

test('etatInstallation : « installee » quand l\'application est autonome', () => {
  assert.equal(etatInstallation({ autonome: true, evenementDisponible: false }), 'installee');
});

test('etatInstallation : autonome l\'emporte sur l\'événement disponible', () => {
  assert.equal(etatInstallation({ autonome: true, evenementDisponible: true }), 'installee');
});

test('etatInstallation : « proposable » quand le navigateur a donné son événement', () => {
  assert.equal(etatInstallation({ autonome: false, evenementDisponible: true }), 'proposable');
});

test('etatInstallation : « manuelle » sans événement et hors installation', () => {
  assert.equal(etatInstallation({ autonome: false, evenementDisponible: false }), 'manuelle');
});

const saine = { priseEnCharge: true, enLigne: true, erreur: false, nouvelle: false };

test('issueVerification : « a_jour » quand rien de neuf n\'arrive', () => {
  assert.equal(issueVerification(saine), 'a_jour');
});

test('issueVerification : « telechargement » quand une version neuve arrive', () => {
  assert.equal(issueVerification({ ...saine, nouvelle: true }), 'telechargement');
});

test('issueVerification : « impossible » sans service worker inscrit', () => {
  assert.equal(issueVerification({ ...saine, priseEnCharge: false }), 'impossible');
});

test('issueVerification : « impossible » hors ligne', () => {
  assert.equal(issueVerification({ ...saine, enLigne: false }), 'impossible');
});

test('issueVerification : « impossible » quand la mise à jour a été rejetée', () => {
  assert.equal(issueVerification({ ...saine, erreur: true }), 'impossible');
});

test('issueVerification : « impossible » l\'emporte sur « nouvelle »', () => {
  assert.equal(issueVerification({ ...saine, enLigne: false, nouvelle: true }), 'impossible');
  assert.equal(issueVerification({ ...saine, erreur: true, nouvelle: true }), 'impossible');
});
