import { StrictMode, Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import type { HelmetServerState } from '@dr.pogodin/react-helmet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
  type RouteObject,
} from 'react-router';

import RootLayout from './layouts/RootLayout';
import Spinner from './components/Spinner';
import { JsonLdSiteUrlProvider } from './lib/json-ld-site-url-context';
import { siteMeta } from './lib/site-meta';
import { routes } from './routes';

export interface RenderResult {
  html: string;
  head: string;
  status: number;
  redirect?: string;
}

const SpinnerFallback = () => (
  <div className="flex justify-center py-8 h-screen items-center">
    <Spinner />
  </div>
);

// Mirrors the layout wrapping in App.tsx so client and server render the same
// tree. Kept separate from the client `router` in App.tsx because
// createBrowserRouter touches `window` at module load and must never be
// evaluated in the SSR bundle.
const routeTree: RouteObject[] = [
  {
    element: (
      <Suspense fallback={<SpinnerFallback />}>
        <RootLayout>
          <Outlet />
        </RootLayout>
      </Suspense>
    ),
    children: routes,
  },
];

const handler = createStaticHandler(routeTree);

export async function render(url: string, siteOrigin?: string, socialPreviewImage?: string): Promise<RenderResult> {
  // createStaticHandler works off a WHATWG Request. We only need the pathname +
  // search; scheme/host don't affect routing. Using a stable sentinel host
  // avoids env-dependent URL parsing.
  const requestUrl = new globalThis.URL(`http://ssr${url}`);
  const context = await handler.query(new Request(requestUrl));

  // A loader/action that throws a Response (or calls redirect()) surfaces here
  // as a Response instead of a StaticHandlerContext. Forward the redirect.
  if (context instanceof Response) {
    return {
      html: '',
      head: '',
      status: context.status,
      redirect: context.headers.get('Location') ?? undefined,
    };
  }

  const router = createStaticRouter(routeTree, context);
  const helmetContext: Record<string, unknown> & { helmet?: HelmetServerState } = {};
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });

  const html = renderToString(
    <StrictMode>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={queryClient}>
          <JsonLdSiteUrlProvider siteUrl={siteOrigin ?? ''}>
            <StaticRouterProvider router={router} context={context} />
          </JsonLdSiteUrlProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );

  const h = helmetContext.helmet;
  // Helmet emits an empty <title> when no page sets one; drop it so the default can fill it.
  const helmetTitle = h?.title?.toString() ?? '';
  const head = h
    ? [
        /<title[^>]*>\s*<\/title>/i.test(helmetTitle) ? '' : helmetTitle,
        h.meta?.toString() ?? '',
        h.link?.toString() ?? '',
        h.script?.toString() ?? '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const defaults = seoHeadDefaults(head, html, requestUrl.pathname, siteOrigin, socialPreviewImage);
  return { html, head: [head, defaults].filter(Boolean).join('\n'), status: context.statusCode ?? 200 };
}

const ENTITY_DECODE: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };

function decodeEntities(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (m) => ENTITY_DECODE[m] ?? m);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const META_TAG = /<meta\s[^>]*>/gi;
const META_KEY = /\b(name|property)=(?:"([^"]*)"|'([^']*)')/i;
const META_CONTENT = /\bcontent=(?:"([^"]*)"|'([^']*)')/i;

/** Content of the first `<meta attr="key">` in head, '' when it has no content, null when absent. */
function metaContent(head: string, attr: 'name' | 'property', key: string): string | null {
  for (const [tag] of head.matchAll(META_TAG)) {
    const found = tag.match(META_KEY);
    if (!found || found[1].toLowerCase() !== attr || (found[2] ?? found[3]) !== key) continue;
    const content = tag.match(META_CONTENT);
    return content ? decodeEntities(content[1] ?? content[2] ?? '') : '';
  }
  return null;
}

/**
 * Marks tags added outside Helmet. They describe only the server-rendered page,
 * so SEO_DEFAULTS_CLEANUP removes them on the first in-app navigation.
 */
const SEO_DEFAULT_ATTR = 'data-airo-seo-default';

/**
 * Shipped with the defaults (not in App.tsx) so every path that installs this
 * file also installs the cleanup. Removes the marked tags:
 * - one at a time, when the page adds its own tag of the same kind (Helmet
 *   metadata that appears after hydration, e.g. once client data loads);
 * - all at once, when the pathname changes (pushState/replaceState/popstate).
 * Afterwards it unwraps history only if nothing wrapped on top; otherwise its
 * wrapper stays a pass-through.
 */
export const SEO_DEFAULTS_CLEANUP = `(function(){var A='${SEO_DEFAULT_ATTR}',p=location.pathname,h=history,d=false,m;function k(e){if(e.nodeType!==1)return null;var t=e.tagName;if(t==='TITLE')return 'title';if(t==='META')return e.getAttribute('property')||e.getAttribute('name');if(t==='SCRIPT'&&e.type==='application/ld'+'+json')return 'ld';return null}function s(n){if(n.nodeType!==1||n.hasAttribute(A))return;var x=k(n);if(x)document.querySelectorAll('['+A+']').forEach(function(e){if(k(e)===x)e.remove()})}function c(){if(d||location.pathname===p)return;d=true;if(m)m.disconnect();document.querySelectorAll('['+A+']').forEach(function(e){e.remove()});if(h.pushState===P)h.pushState=o;if(h.replaceState===R)h.replaceState=r;removeEventListener('popstate',c)}var o=h.pushState,r=h.replaceState;function P(){var x=o.apply(this,arguments);c();return x}function R(){var x=r.apply(this,arguments);c();return x}h.pushState=P;h.replaceState=R;addEventListener('popstate',c);if(typeof MutationObserver==='function'){m=new MutationObserver(function(l){l.forEach(function(r){r.addedNodes.forEach(s)})});m.observe(document.head,{childList:true})}})()`;

/**
 * Head tags derived from the page's own title/description and siteMeta, for each
 * one the rendered page does not already set. Page values always win. The image
 * falls back to the page's other image tag, then the platform social image.
 */
function seoHeadDefaults(head: string, html: string, pathname: string, siteOrigin?: string, socialPreviewImage?: string): string {
  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeEntities(titleMatch?.[1] ?? '').trim() || siteMeta.name.trim();
  const description = (metaContent(head, 'name', 'description') ?? '').trim() || siteMeta.summary.trim();
  const origin = (siteOrigin || import.meta.env.VITE_PUBLIC_URL || '').replace(/\/$/, '');
  const pageUrl = /^https?:\/\//.test(origin) ? `${origin}${pathname}` : '';
  const ogImage = metaContent(head, 'property', 'og:image')?.trim() ?? '';
  const twitterImage = metaContent(head, 'name', 'twitter:image')?.trim() ?? '';

  const tags: string[] = [];
  const add = (attr: 'name' | 'property', key: string, value: string): void => {
    if (value && metaContent(head, attr, key) === null) {
      tags.push(`<meta ${attr}="${key}" content="${escapeHtml(value)}" ${SEO_DEFAULT_ATTR}>`);
    }
  };
  if (!titleMatch && title) tags.push(`<title ${SEO_DEFAULT_ATTR}>${escapeHtml(title)}</title>`);
  add('name', 'description', description);
  add('property', 'og:title', title);
  add('property', 'og:description', description);
  add('property', 'og:type', 'website');
  add('property', 'og:url', pageUrl);
  const image = ogImage || twitterImage || (socialPreviewImage ?? '');
  add('property', 'og:image', image);
  add('name', 'twitter:image', image);
  add('name', 'twitter:card', image ? 'summary_large_image' : 'summary');

  const hasJsonLd = /<script[^>]*\btype=["']application\/ld\+json["']/i.test(head + html);
  if (!hasJsonLd && title) {
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      ...(description ? { description } : {}),
      ...(pageUrl ? { url: pageUrl } : {}),
    };
    tags.push(`<script type="application/ld+json" ${SEO_DEFAULT_ATTR}>${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`);
  }
  if (tags.length > 0) tags.push(`<script ${SEO_DEFAULT_ATTR}>${SEO_DEFAULTS_CLEANUP}</script>`);
  return tags.join('\n');
}
