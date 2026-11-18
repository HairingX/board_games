/**
 * What the app says about itself to the phone: its name, description and the colours of its
 * background, used by the web app manifest and the page's head. The background colours must
 * match --bg in src/app.css, which CSS cannot read from here.
 */
export const appMeta = {
  name: 'Småspil',
  description: 'Små spil til hele familien, der virker uden internet.',
  lang: 'da',
  background: { light: '#f4efe6', dark: '#16121a' },
} as const;
