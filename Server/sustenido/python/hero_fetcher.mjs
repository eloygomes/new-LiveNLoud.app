import Hero from '@ulixee/hero';

let input = '';
for await (const chunk of process.stdin) input += chunk;

let hero;
try {
  const { url } = JSON.parse(input);
  if (!/^https?:\/\//i.test(url)) throw new Error('Invalid URL');
  hero = new Hero({ showChrome: false });
  const response = await hero.goto(url);
  await hero.waitForPaintingStable();
  const html = await hero.document.documentElement.outerHTML;
  process.stdout.write(JSON.stringify({ success: true, status: response?.statusCode ?? null, html, error: null }));
} catch (error) {
  process.stdout.write(JSON.stringify({ success: false, status: null, html: '', error: String(error?.message || error) }));
  process.exitCode = 1;
} finally {
  if (hero) await hero.close().catch(() => {});
}
