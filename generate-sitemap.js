const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');
const { Readable } = require('stream');

// This is a simplified example. In a real app, you might fetch dynamic
// routes from an API or database.
async function generateSitemap() {
  const staticRoutes = [
    '/',
    '/login',
    '/profile',
    '/custom-settings',
    '/create-game',
    '/multiplayer',
  ];

  // Example of fetching dynamic routes
  // const dynamicRoutes = await fetchMyDynamicRoutesFromApi();

  const links = staticRoutes.map(route => ({ url: route, changefreq: 'weekly', priority: 0.8 }));

  // Create a stream to write to
  const stream = new SitemapStream({ hostname: 'https://betterbibleguesser.com' });

  // Turn the stream into a promise that resolves with the XML string
  const sitemap = await streamToPromise(Readable.from(links).pipe(stream))
    .then((data) => data.toString());

  // Write the sitemap to the src directory so it gets included in the build
  fs.writeFileSync('src/sitemap.xml', sitemap);
  console.log('✅ sitemap.xml generated!');
}

generateSitemap();
