/**
 * Estado global (fuera de React) del modo demo.
 *
 * Vive en un módulo aparte para que `lib/api.ts` pueda consultarlo sin importar
 * componentes ni crear dependencias circulares.
 */

const STORAGE_KEY = 'oa-manager:demo-active';

let active = readInitial();
const listeners = new Set<() => void>();

function readInitial(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDemoActive(): boolean {
  return active;
}

export function setDemoActive(value: boolean): void {
  if (active === value) return;
  active = value;
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, '1');
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sessionStorage puede no estar disponible: el modo demo sigue funcionando en memoria */
  }
  listeners.forEach((listener) => listener());
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
