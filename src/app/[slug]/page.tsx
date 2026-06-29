import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LANDING_PAGES } from '@/lib/landing-pages';
import LandingPage from '../page';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(LANDING_PAGES).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = LANDING_PAGES[slug];

  if (!config) {
    return {};
  }

  return {
    title: config.metaTitle,
    description: config.metaDesc,
    alternates: {
      canonical: `https://zaproshenya.site/${slug}`,
    },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDesc,
      url: `https://zaproshenya.site/${slug}`,
      type: 'website',
      images: [
        {
          url: '/icon.png',
          width: 512,
          height: 512,
          alt: config.metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.metaTitle,
      description: config.metaDesc,
      images: ['/icon.png'],
    },
  };
}

export default async function CustomLandingPage({ params }: Props) {
  const { slug } = await params;
  const config = LANDING_PAGES[slug];

  if (!config) {
    notFound();
  }

  return <LandingPage config={config} />;
}
