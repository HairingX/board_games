import { afterEach, describe, expect, it, vi } from 'vitest';
import { photoSize, squarePhoto, type PhotoTools } from './photo';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('squarePhoto', () => {
  it('keeps the middle square of a photo, made small', async () => {
    const draw = vi.fn<PhotoTools['draw']>(() => 'data:image/jpeg;base64,AAA');
    const tools: PhotoTools = { read: () => Promise.resolve({ width: 400, height: 300 }), draw };
    expect(await squarePhoto(new Blob(), tools)).toBe('data:image/jpeg;base64,AAA');
    expect(draw).toHaveBeenCalledWith(
      { width: 400, height: 300 },
      { x: 50, y: 0, side: 300 },
      photoSize,
    );
  });

  it('uses the browser to read the photo and draw it as a JPEG', async () => {
    const bitmap = { width: 100, height: 200 };
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(() => Promise.resolve(bitmap)),
    );
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/jpeg;base64,BBB');

    expect(await squarePhoto(new Blob())).toBe('data:image/jpeg;base64,BBB');
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 50, 100, 100, 0, 0, photoSize, photoSize);
    expect(toDataURL).toHaveBeenCalledWith('image/jpeg', 0.85);
  });
});
