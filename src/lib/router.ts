import { useEffect, useState } from 'react';

/*
 * Every screen has its own address in the location's hash, such as `#/indstillinger/familien`,
 * so reloading, updating or reopening the app shows the same screen again, and the phone's own
 * back gesture goes back a screen.
 */

/** A page of the settings. */
export type SettingsPage =
  | { name: 'main' }
  | { name: 'family' }
  | { name: 'family-new' }
  | { name: 'person'; id: string }
  | { name: 'lock' }
  | { name: 'sound' };

/** Where in the app a screen is. */
export type Route =
  /** The start screen: the app's start address, with no hash. */
  | { name: 'start' }
  | { name: 'home' }
  | { name: 'settings'; page: SettingsPage }
  | {
      name: 'game';
      id: string;
      /** The ids of the players chosen, or null while they are being chosen. */
      players: readonly string[] | null;
      /** Where in the game, for the game's own screens; empty at its start. */
      place: readonly string[];
    }
  | { name: 'unknown' };

/** A part of an address: lowercase letters, digits and hyphens. */
const part = /^[a-z0-9-]+$/;

const settingsPages: Readonly<Record<string, SettingsPage>> = {
  '': { name: 'main' },
  familien: { name: 'family' },
  'familien/ny': { name: 'family-new' },
  voksenlaas: { name: 'lock' },
  'beta/lyd': { name: 'sound' },
};

/** The screen a location hash names: no hash is the start screen, `#/` the home screen. */
export function parseRoute(hash: string): Route {
  if (hash === '') return { name: 'start' };
  const parts = hash.replace(/^#\/?/, '').replace(/\/$/, '').split('/');
  const [first = '', ...rest] = parts;
  if (first === '' && rest.length === 0) return { name: 'home' };
  if (first === 'indstillinger') {
    const page = settingsPages[rest.join('/')];
    if (page) return { name: 'settings', page };
    const [family, id, ...more] = rest;
    if (family === 'familien' && id && part.test(id) && more.length === 0) {
      return { name: 'settings', page: { name: 'person', id } };
    }
    return { name: 'unknown' };
  }
  if (first === 'spil') {
    const [id, players, ...place] = rest;
    if (!id || !part.test(id)) return { name: 'unknown' };
    if (players === undefined) return { name: 'game', id, players: null, place: [] };
    const ids = players.split('+');
    if (!ids.every((one) => part.test(one)) || !place.every((one) => part.test(one))) {
      return { name: 'unknown' };
    }
    return { name: 'game', id, players: ids, place };
  }
  return { name: 'unknown' };
}

/** A screen the app goes to; the start screen is where it opens, never gone to. */
export type Destination = Exclude<Route, { name: 'start' | 'unknown' }>;

/** The hash that leads to the screen. */
export function routeHref(route: Destination): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'settings':
      return `#/indstillinger${settingsHref(route.page)}`;
    case 'game':
      return [
        `#/spil/${route.id}`,
        ...(route.players ? [route.players.join('+'), ...route.place] : []),
      ].join('/');
  }
}

function settingsHref(page: SettingsPage): string {
  switch (page.name) {
    case 'main':
      return '';
    case 'family':
      return '/familien';
    case 'family-new':
      return '/familien/ny';
    case 'person':
      return `/familien/${page.id}`;
    case 'lock':
      return '/voksenlaas';
    case 'sound':
      return '/beta/lyd';
  }
}

/** The hash that leads to a game's start, where its players are chosen. */
export function gameHref(id: string): string {
  return routeHref({ name: 'game', id, players: null, place: [] });
}

/** Goes to the screen, as a new step the back gesture can undo. */
export function navigate(route: Destination): void {
  window.location.hash = routeHref(route);
}

/** The screen the location's hash names, kept up to date; each new screen starts at the top. */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    function onHashChange(): void {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);
  return route;
}
