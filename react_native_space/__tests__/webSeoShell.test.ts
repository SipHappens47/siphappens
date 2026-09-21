import fs from 'fs';
import path from 'path';
import { SITE_NAME, SITE_OG_TITLE, SITE_TAGLINE } from '../src/constants/site';

const publicIndex = fs.readFileSync(
  path.join(__dirname, '../public/index.html'),
  'utf8',
);
const htmlShell = fs.readFileSync(
  path.join(__dirname, '../app/+html.tsx'),
  'utf8',
);

describe('web SEO shell', () => {
  it('does not ship Expo template tokens in the static index', () => {
    expect(publicIndex).not.toMatch(/%WEB_TITLE%|%LANG_ISO_CODE%/);
    expect(publicIndex).toContain('lang="en"');
    expect(publicIndex).toContain('<title>SipHappens</title>');
  });

  it('uses an ASCII hyphen in OG titles (no em/en dash)', () => {
    expect(SITE_OG_TITLE).toBe(`${SITE_NAME} - ${SITE_TAGLINE}`);
    expect(SITE_OG_TITLE).not.toMatch(/[\u2013\u2014]/);
    expect(publicIndex).toContain(`content="${SITE_OG_TITLE}"`);
    expect(publicIndex).not.toMatch(/[\u2013\u2014]/);
    expect(htmlShell).toContain('SITE_OG_TITLE');
    expect(htmlShell).not.toMatch(/[\u2013\u2014]/);
  });
});
