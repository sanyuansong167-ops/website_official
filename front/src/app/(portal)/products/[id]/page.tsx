import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageState } from "@/components/common/PageState";
import { Container } from "@/components/layout/Container";
import { ProductDetailPage } from "@/features/portal-detail/ProductDetailPage";
import { ApiError } from "@/services/http";
import { getProductDetail } from "@/services/portal-api";

type ProductDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Readonly<ProductDetailRouteProps>): Promise<Metadata> {
  const productId = getProductId((await params).id);
  if (!productId) return {};

  const product = await loadProductDetail(productId);
  return product
    ? { description: product.seoDescription || product.description, title: product.seoTitle || product.title }
    : {};
}

export default async function ProductDetailRoute({ params }: Readonly<ProductDetailRouteProps>) {
  const productId = getProductId((await params).id);
  if (!productId) notFound();

  const product = await loadProductDetail(productId);
  if (!product) {
    return (
      <Container as="main">
        <PageState description="请稍后刷新页面重试。" status="error" title="产品信息暂时不可用" />
      </Container>
    );
  }

  return <ProductDetailPage product={product} />;
}

function getProductId(value: string) {
  const productId = Number(value);
  return Number.isSafeInteger(productId) && productId > 0 ? productId : null;
}

async function loadProductDetail(productId: number) {
  try {
    return await getProductDetail(productId);
  } catch (error) {
    if (error instanceof ApiError && ["30001", "40001"].includes(String(error.code))) notFound();
    return null;
  }
}
