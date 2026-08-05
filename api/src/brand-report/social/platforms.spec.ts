import { PLATFORM_ADAPTERS, type SocialHttp } from './platforms';

/** HTTP mocké : renvoie un status/texte canné par URL, sans réseau. */
function mockHttp(routes: { status?: Record<string, number>; text?: Record<string, string> }): SocialHttp {
  return {
    async status(url) {
      const key = Object.keys(routes.status ?? {}).find((k) => url.includes(k));
      return key ? routes.status![key] : 599;
    },
    async text(url) {
      const key = Object.keys(routes.text ?? {}).find((k) => url.includes(k));
      return key ? routes.text![key] : '';
    },
  };
}

const adapter = (name: string) => PLATFORM_ADAPTERS.find((a) => a.platform === name)!;

describe('PLATFORM_ADAPTERS', () => {
  describe('GitHub (status 404=free / 200=taken)', () => {
    const gh = adapter('GitHub');
    it('taken', async () => expect(await gh.check('x', mockHttp({ status: { 'github.com/x': 200 } }))).toBe('taken'));
    it('free', async () => expect(await gh.check('x', mockHttp({ status: { 'github.com/x': 404 } }))).toBe('free'));
    it('autre code → unknown', async () =>
      expect(await gh.check('x', mockHttp({ status: { 'github.com/x': 500 } }))).toBe('unknown'));
  });

  describe('Telegram (contenu tgme_page)', () => {
    const tg = adapter('Telegram');
    it('profil → taken', async () =>
      expect(await tg.check('x', mockHttp({ text: { 't.me/x': '<div class="tgme_page_title">@x</div>' } }))).toBe('taken'));
    it('page générique → free', async () =>
      expect(await tg.check('x', mockHttp({ text: { 't.me/x': '<div class="tgme_page">generic</div>' } }))).toBe('free'));
    it('page inattendue → unknown', async () =>
      expect(await tg.check('x', mockHttp({ text: { 't.me/x': 'blocked' } }))).toBe('unknown'));
  });

  describe('TikTok (marqueur statusCode)', () => {
    const tt = adapter('TikTok');
    it('userInfo → taken', async () =>
      expect(await tt.check('x', mockHttp({ text: { 'tiktok.com/@x': '{"userInfo":{}}' } }))).toBe('taken'));
    it('statusCode 10221 → free', async () =>
      expect(await tt.check('x', mockHttp({ text: { 'tiktok.com/@x': '{"statusCode":10221}' } }))).toBe('free'));
    it('ni l\'un ni l\'autre → unknown', async () =>
      expect(await tt.check('x', mockHttp({ text: { 'tiktok.com/@x': '{}' } }))).toBe('unknown'));
  });

  it('plateformes planifiées → toujours unknown', async () => {
    const planned = PLATFORM_ADAPTERS.filter((a) => a.planned);
    expect(planned.length).toBeGreaterThan(0);
    for (const a of planned) {
      expect(await a.check('anything', mockHttp({}))).toBe('unknown');
    }
  });
});
