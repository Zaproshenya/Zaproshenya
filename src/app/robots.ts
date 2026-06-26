import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/home/', '/create/', '/friends/', '/notifications/', '/profile/'],
    },
    sitemap: 'https://zaproshenya.site/sitemap.xml',
  };
}
