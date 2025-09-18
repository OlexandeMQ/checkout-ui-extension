import { useEffect, useState } from "react";

import {
  reactExtension,
  Text,
  useApi,
  useInstructions,
  useTranslate,
  useApplyCartLinesChange,
  BlockStack,
  View,
  InlineStack,
  InlineLayout,
  Image,
  Button,
  useCartLines,
  Banner,
  SkeletonText,
  Heading,
  SkeletonImage,
  Divider,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.cart-line-list.render-after", () => (
  <Extension />
));

type Product = {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  featuredImage?: {
    url: string;
    altText?: string | null;
  } | null;
  variants: {
    edges: { node: { id: string; price: { amount: string; currencyCode: string } } }[];
  };
};

type ProductsQueryResponse = {
  products: {
    edges: {
      node: Product;
    }[];
  };
};

function Extension() {
  const translate = useTranslate();
  const { query, i18n } = useApi();
  const cartLines = useCartLines();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const applyCartLinesChange = useApplyCartLinesChange();
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showError, setShowError] = useState(false);
  const { product_tag } = useSettings();

  const tag = product_tag ?? 'checkout-product'

  useEffect(() => {
    async function fetchProducts() {
      const response = await query<ProductsQueryResponse>(
        `#graphql
        query getProducts {
          products(first: 10, query: "tag:${tag}") {
            edges {
              node {
                id
                title
                handle
                tags
                featuredImage {
                  url
                  altText
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }`
      );

      console.log("Products with tag checkout-product:", response);
      setProducts(response.data.products.edges.map((edge) => edge.node));
    }

    fetchProducts();
  }, []);

  async function handleAdd(product: Product) {
    const firstVariant = product.variants.edges[0]?.node;
    if (!firstVariant) return;

    setAdding(true);
    const result = await applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: firstVariant.id,
      quantity: 1,
    },);
    setAdding(false);


    if (result.type === 'error') {
      setShowError(true);
      console.error(result.message);
    }

    setCurrentIndex((prevIndex) => {
      const updatedAvailable = products.filter((p) => {
        const variantId = p.variants.edges[0]?.node.id;
        return variantId && !cartVariantIds.includes(variantId) && variantId !== firstVariant.id;
      });

      if (updatedAvailable.length === 0) return 0;

      return (prevIndex + 1) % updatedAvailable.length;
    });
  }

  const cartVariantIds = cartLines.map((line) => line.merchandise.id);

  const availableProducts = products.filter((p) => {
    const variantId = p.variants.edges[0]?.node.id;
    return variantId && !cartVariantIds.includes(variantId);
  });


  console.log(availableProducts);

  const product = availableProducts[currentIndex];

  if (!product) return null;


  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!loading && products.length === 0) {
    return null;
  }


  const variant = product.variants.edges[0]?.node;

  if (!variant) return null;

  const imageUrl = product.featuredImage.url ?? 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081';
  const renderPrice = i18n.formatCurrency(Number(variant.price.amount)).replace('US', '').trim();

  return (
    <BlockStack spacing="loose">
      <BlockStack
        border="base"
        cornerRadius="loose"
        padding="base"
        background="base"
      >
        <Text size="medium" emphasis="bold">
          Best selling add-ons
        </Text>

        <View
          key={product.id}
        >
          <InlineLayout columns={['15%', 'auto', '32%']} spacing="base" blockAlignment="center">
            <View
              maxInlineSize={43}
            >
              {imageUrl && (
                <Image
                  source={imageUrl}
                  fit="cover"
                />
              )}
            </View>

            <BlockStack spacing="extraTight" inlineAlignment="start">
              <Text>{product.title}</Text>
              <Text size="small" emphasis="bold">
                {renderPrice}
              </Text>
            </BlockStack>

            <Button
              kind='primary'
              loading={adding}
              accessibilityLabel={`Add ${product.title} to cart`}
              onPress={() => handleAdd(product)}
            >
              <Text size='small'>
                Add – {renderPrice}
              </Text>
            </Button>
          </InlineLayout>
        </View>
      </BlockStack>
      {showError && <ErrorBanner />}
    </BlockStack>
  );
}

function LoadingSkeleton() {
  return (
    <BlockStack spacing='loose'>
      <Divider />
      <Heading level={2}> Best selling add-ons</Heading>
      <BlockStack spacing='loose'>
        <InlineLayout
          spacing='base'
          columns={[64, 'fill', 'auto']}
          blockAlignment='center'
        >
          <SkeletonImage aspectRatio={1} />
          <BlockStack spacing='none'>
            <SkeletonText inlineSize='large' />
            <SkeletonText inlineSize='small' />
          </BlockStack>
          <Button kind='secondary' disabled={true}>
            Add
          </Button>
        </InlineLayout>
      </BlockStack>
    </BlockStack>
  );
}

function ErrorBanner() {
  return (
    <Banner status='critical'>
      There was an issue adding this product. Please try again.
    </Banner>
  );
}
