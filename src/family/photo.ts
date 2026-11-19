/** How many pixels wide and high a profile's photo is kept: sharp on any phone, yet small. */
export const photoSize = 192;

/** The browser's ways to read a picture and draw it smaller; the tests give their own. */
export interface PhotoTools {
  read: (file: Blob) => Promise<{ width: number; height: number }>;
  draw: (
    picture: { width: number; height: number },
    crop: { x: number; y: number; side: number },
    size: number,
  ) => string;
}

const browserTools: PhotoTools = {
  read: (file) => createImageBitmap(file),
  draw: (picture, crop, size) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas
      .getContext('2d')
      ?.drawImage(picture as ImageBitmap, crop.x, crop.y, crop.side, crop.side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  },
};

/**
 * A photo from the phone as a profile's picture: the middle square of it, made small, as a data
 * URL that is saved with the family on the phone.
 */
export async function squarePhoto(file: Blob, tools: PhotoTools = browserTools): Promise<string> {
  const picture = await tools.read(file);
  const side = Math.min(picture.width, picture.height);
  const crop = {
    x: Math.round((picture.width - side) / 2),
    y: Math.round((picture.height - side) / 2),
    side,
  };
  return tools.draw(picture, crop, photoSize);
}
