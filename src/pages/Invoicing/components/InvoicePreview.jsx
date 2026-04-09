// src/pages/Invoicing/components/InvoicePreview.jsx
// Pixel-exact preview of the client email.
// Uses the SAME template module as netlify/functions/send-invoice.js
// so this preview is literally what the client receives in their inbox.

import { useMemo } from 'react';
import { Box, VStack, HStack, Text, Icon } from '@chakra-ui/react';
import { TbClock, TbMailFast } from 'react-icons/tb';
import { buildInvoiceEmailHTML } from '../../../lib/invoiceEmailTemplate';

const InvoicePreview = ({ invoice, client, sprints }) => {
  // Build the exact email HTML using the shared template.
  // useMemo so we don't rebuild the iframe content on every parent re-render.
  const html = useMemo(() => {
    if (!client || !sprints || sprints.length === 0) return null;

    const invoiceDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return buildInvoiceEmailHTML({
      invoice: {
        invoice_number: invoice?.invoice_number || 'NB______',
      },
      client,
      project: null, // Project lookup happens server-side; preview shows just client
      lineItems: sprints,
      invoiceDate,
      payUrl: '#preview',
    });
  }, [invoice, client, sprints]);

  if (!html) {
    return (
      <Box
        py={20}
        textAlign="center"
        border="1px dashed"
        borderColor="surface.800"
        borderRadius="2xl"
      >
        <VStack spacing={3}>
          <Icon as={TbClock} boxSize={10} color="surface.700" />
          <Text color="surface.500" fontSize="sm">
            {!client
              ? 'Select a client to see the preview'
              : 'Add at least one billable sprint to see the preview'}
          </Text>
          <Text color="surface.700" fontSize="2xs" fontFamily="mono">
            WIP sprints are hidden from the client
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Preview indicator strip */}
      <HStack spacing={2} justify="center" pb={2}>
        <Icon as={TbMailFast} boxSize={3.5} color="brand.500" />
        <Text
          fontSize="2xs"
          color="brand.500"
          fontWeight="700"
          letterSpacing="0.12em"
          textTransform="uppercase"
          fontFamily="mono"
        >
          Exact Email Preview
        </Text>
      </HStack>

      {/* The iframe containing the real email HTML */}
      <Box
        borderRadius="2xl"
        overflow="hidden"
        border="1px solid"
        borderColor="surface.800"
        boxShadow="0 8px 32px rgba(0,0,0,0.4)"
        bg="#000000"
      >
        <Box
          as="iframe"
          srcDoc={html}
          title="Invoice email preview"
          width="100%"
          minH="900px"
          h="auto"
          border="none"
          display="block"
          sandbox="allow-same-origin"
          ref={(iframe) => {
            // Auto-resize iframe to content height
            if (!iframe) return;
            const handleLoad = () => {
              try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (doc?.body) {
                  const height = doc.body.scrollHeight;
                  iframe.style.height = `${height + 40}px`;
                }
              } catch (err) {
                // Ignore cross-origin errors
              }
            };
            iframe.addEventListener('load', handleLoad);
            // Also try a delayed resize for image loading
            setTimeout(handleLoad, 500);
            setTimeout(handleLoad, 1500);
          }}
        />
      </Box>

      <Text color="surface.700" fontSize="2xs" fontFamily="mono" textAlign="center">
        This is exactly what {client?.name?.split(' ')[0] || 'the client'} will receive
      </Text>
    </VStack>
  );
};

export default InvoicePreview;