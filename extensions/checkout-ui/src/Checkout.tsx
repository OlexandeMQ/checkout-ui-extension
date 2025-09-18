import {
  reactExtension,
  Banner,
  BlockStack,
  Checkbox,
  Text,
  useApi,
  View,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  InlineStack,
  Icon,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const instructions = useInstructions();

  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!instructions.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <Banner title="checkout-ui" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <View
      border="dotted"
      borderWidth="medium"
      padding="base"
      background='base'
    >
      <InlineStack blockAlignment="center" spacing="base">
        <Icon source='truck' />

        <BlockStack spacing="extraTight">
          <Text size="medium" emphasis="bold">
            {translate("highDemandTitle")}
          </Text>
          <Text size="small" appearance="subdued">
            {translate("highDemandSubtitle", { time: formatTime(timeLeft) })}
          </Text>
        </BlockStack>
      </InlineStack>
    </View>
  );
}
