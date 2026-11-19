import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { gameHref, navigate, parseRoute, routeHref, useRoute, type Route } from './router';

describe('parseRoute', () => {
  it.each(['', '#', '#/', '#//'])('reads %j as home', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'home' });
  });

  it.each([
    ['#/indstillinger', { name: 'main' }],
    ['#/indstillinger/', { name: 'main' }],
    ['#/indstillinger/familien', { name: 'family' }],
    ['#/indstillinger/familien/ny', { name: 'family-new' }],
    ['#/indstillinger/familien/3f2a-b9', { name: 'person', id: '3f2a-b9' }],
    ['#/indstillinger/voksenlaas', { name: 'lock' }],
    ['#/indstillinger/beta/lyd', { name: 'sound' }],
  ])('reads %j as a page of the settings', (hash, page) => {
    expect(parseRoute(hash)).toEqual({ name: 'settings', page });
  });

  it('reads a game, its players and where in it', () => {
    expect(parseRoute('#/spil/parkort')).toEqual({
      name: 'game',
      id: 'parkort',
      players: null,
      place: [],
    });
    expect(parseRoute('#/spil/parkort/far+mor/kort')).toEqual({
      name: 'game',
      id: 'parkort',
      players: ['far', 'mor'],
      place: ['kort'],
    });
  });

  it.each([
    '#/ukendt',
    '#/spil',
    '#/spil/Store',
    '#/spil/parkort/far+Mor',
    '#/spil/parkort/far/Kort',
    '#/indstillinger/ukendt',
    '#/indstillinger/familien/Far',
    '#/indstillinger/familien/far/mere',
  ])('reads %j as no screen it knows', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'unknown' });
  });

  it.each<Exclude<Route, { name: 'unknown' }>>([
    { name: 'home' },
    { name: 'settings', page: { name: 'main' } },
    { name: 'settings', page: { name: 'family' } },
    { name: 'settings', page: { name: 'family-new' } },
    { name: 'settings', page: { name: 'person', id: 'mille' } },
    { name: 'settings', page: { name: 'lock' } },
    { name: 'settings', page: { name: 'sound' } },
    { name: 'game', id: 'parkort', players: null, place: [] },
    { name: 'game', id: 'parkort', players: ['far', 'mor'], place: [] },
    { name: 'game', id: 'parkort', players: ['far', 'mor'], place: ['kort', 'to'] },
  ])('reads back the address of %j', (route) => {
    expect(parseRoute(routeHref(route))).toEqual(route);
  });

  it('leads to a game’s start', () => {
    expect(gameHref('regnespil')).toBe('#/spil/regnespil');
  });
});

describe('useRoute', () => {
  it('follows the address, and starts each new screen at the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const { result, unmount } = renderHook(() => useRoute());
    expect(result.current).toEqual({ name: 'home' });
    act(() => {
      navigate({ name: 'settings', page: { name: 'lock' } });
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(window.location.hash).toBe('#/indstillinger/voksenlaas');
    expect(result.current).toEqual({ name: 'settings', page: { name: 'lock' } });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    unmount();
    scrollTo.mockRestore();
  });
});
