export const siteConfig = {
  topBar: {
    message: 'Free next-day delivery in Accra & Kumasi on orders above GHC 250',
    payment: 'Secure MoMo Payment',
    support: 'Mon-Sat, 8am-8pm Support',
  },
  contact: {
    location: 'Accra Digital Centre, Circle, Accra',
    phone: '+233 24 000 0000',
    email: 'hello@backthred.com.gh',
    whatsappLabel: 'Chat on WhatsApp',
    whatsappHref: 'https://wa.me/233246789655',
    supportHours: 'Mon-Sat, 8am-8pm',
  },
  header: {
    searchPlaceholder: 'Search sneakers, electronics, skincare...',
    trackOrderHref: '/account/orders',
  },
  homepage: {
    hero: {
      eyebrow: 'Restocked weekly',
      title: 'Fresh Arrivals Across Every Category',
      description:
        'Clothing, electronics, home products, beauty and more. New items in regularly.',
      primaryCta: 'Shop New Arrivals',
      primaryHref: '/products?sort=latest',
      secondaryCta: 'Browse Categories',
      secondaryHref: '/products',
      imageSrc: '/images/hero.jpg',
      imageAlt: 'Fresh arrivals from Backthred',
    },
    sidePromos: [
      {
        title: 'Electronics',
        text: 'New stock in',
        href: '/products?category=electronics',
        imageSrc: '/images/electronics.jpg',
      },
      {
        title: 'Home & Living',
        text: 'Useful items restocked',
        href: '/products?category=home-living',
        imageSrc: '/images/home.jpg',
      },
      {
        title: 'Beauty',
        text: 'Popular this week',
        href: '/products?category=beauty',
        imageSrc: '/images/beauty.jpg',
      },
    ],
    banner: {
      eyebrow: 'Recently Restocked',
      title: "Women's Fashion Fresh In This Week",
      ctaLabel: "Shop Women's",
      href: '/products?category=womens-fashion',
      imageSrc: '/images/hero.jpg',
    },
  },
  footer: {
    description:
      'Your go-to online retailer for clothing, electronics, home goods, beauty products and more. Delivering across Ghana.',
    shopLinks: [
      { href: '/products?sort=latest', label: 'New Arrivals' },
      { href: '/products?category=mens-fashion', label: "Men's Fashion" },
      { href: '/products?category=womens-fashion', label: "Women's Fashion" },
      { href: '/products?category=electronics', label: 'Electronics' },
      { href: '/products?category=home-living', label: 'Home & Living' },
      { href: '/products?category=beauty', label: 'Beauty & Wellness' },
      { href: '/products?on_sale=true', label: 'Flash Sales' },
    ],
    careLinks: [
      { href: '/contact', label: 'Contact Us' },
      { href: '/account/orders', label: 'Track Your Order' },
      { href: '/shipping-and-delivery', label: 'Shipping & Delivery' },
      { href: '/returns-and-exchanges', label: 'Returns & Exchanges' },
      { href: '/faqs', label: 'FAQs' },
      { href: '/about', label: 'About Us' },
    ],
    legalLinks: [
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/terms-of-service', label: 'Terms of Service' },
    ],
  },
};
