import { useEffect, useState } from 'react';

import {
  reactExtension,
  useSettings,
  Text,
  Heading,
  InlineStack,
  Image,
  useCartLines,
  useApi,
  BlockSpacer,
  Divider,
  Grid,
  View,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render', () => <Extension />
);

type MetaobjectField = {
  key: string;
  value: string;
  reference?: {
    image?: {
      url?: string;
      altText?: string;
    } | null;
  } | null;
};

type MetaobjectNode = {
  id: string;
  fields: MetaobjectField[];
};

type MetaobjectEdge = {
  node: MetaobjectNode;
};

type MetaobjectsResponse = {
  metaobjects: {
    edges: MetaobjectEdge[];
  };
};

function Extension() {
  const { query } = useApi();
  const [benefits, setBenefits] = useState<MetaobjectNode[]>([]);
  const { features_title } = useSettings();

  useEffect(() => {
    async function fetchMetaobjects() {
      const response = await query<MetaobjectsResponse>(`
      query {
        metaobjects(first: 4, type: "checkout_benefits_item") {
          edges {
            node {
              id
              fields {
                key
                value
                 reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);
      setBenefits(response.data.metaobjects.edges.map(edge => edge.node));
    }

    fetchMetaobjects();
  }, []);

  if (!features_title && !benefits) {
    return null;
  }

  return (
    <>
      <Divider />
      <BlockSpacer />
      <Heading level={2}>{features_title}</Heading>
      <BlockSpacer />

      <Grid
        columns={['50%', '50%']}
        rows={['auto', 'auto']}
        spacing="loose"
      >
        {
          benefits.map((benefit) => {
            const imageItem = benefit.fields.find(f => f.key === 'benefit_icon')?.reference?.image;
            const nameItem = benefit.fields.find(f => f.key === 'benefit_name')?.value;

            if (!imageItem || !nameItem) {
              return null;
            }
            return (
              <InlineStack blockAlignment='center' inlineAlignment='start' key={benefit.id}>
                <View
                  maxInlineSize={60}
                  maxBlockSize={60}
                  blockAlignment="center"
                  inlineAlignment="center">
                  <Image
                    source={imageItem?.url}
                    accessibilityDescription={imageItem?.altText}
                    fit="contain"
                  />
                </View>

                <Text size='base'>{nameItem}</Text>
              </InlineStack>
            )
          })
        }
      </Grid>
    </>
  );
}
