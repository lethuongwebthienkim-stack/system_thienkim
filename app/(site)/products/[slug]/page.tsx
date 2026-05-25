'use client';

import React from 'react';
import ProductDetailPageShared from '../../_components/details/ProductDetailPage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function LegacyProductDetailPage({ params }: PageProps) {
  return <ProductDetailPageShared params={params} />;
}
