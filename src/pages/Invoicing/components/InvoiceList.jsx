// src/pages/Invoicing/components/InvoiceList.jsx
import {
  Box, VStack, HStack, Text, Icon, Badge, Center,
  Spinner, Divider, Button, IconButton, Tooltip,
} from '@chakra-ui/react';
import {
  TbFileInvoice, TbMail, TbCheck, TbClock,
  TbAlertTriangle, TbEye, TbSend,
} from 'react-icons/tb';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     icon: TbFileInvoice,   color: 'surface.500', bg: 'rgba(128,128,128,0.08)', border: 'rgba(128,128,128,0.25)' },
  sent:      { label: 'Sent',      icon: TbMail,          color: 'brand.500',   bg: 'rgba(0,229,229,0.08)',   border: 'rgba(0,229,229,0.25)' },
  viewed:    { label: 'Viewed',    icon: TbEye,           color: 'accent.banana', bg: 'rgba(255,229,0,0.08)', border: 'rgba(255,229,0,0.25)' },
  paid:      { label: 'Paid',      icon: TbCheck,         color: 'accent.neon', bg: 'rgba(57,255,20,0.08)',   border: 'rgba(57,255,20,0.25)' },
  overdue:   { label: 'Overdue',   icon: TbAlertTriangle, color: 'status.red',  bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.25)' },
  cancelled: { label: 'Cancelled', icon: TbFileInvoice,   color: 'surface.600', bg: 'rgba(128,128,128,0.06)', border: 'rgba(128,128,128,0.15)' },
};

const InvoiceRow = ({ invoice, onEdit, onPreview }) => {
  const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const total = parseFloat(invoice.total || 0);
  const paid = parseFloat(invoice.total_paid || 0);
  const itemCount = invoice.line_items?.length || 0;
  const canSend = invoice.status === 'draft' && invoice.client_email;

  return (
    <HStack
      py={3.5}
      px={4}
      spacing={4}
      transition="all 0.15s"
      borderRadius="lg"
      _hover={{ bg: 'surface.850' }}
    >
      <Box
        w="6px"
        h="6px"
        borderRadius="full"
        bg={config.color}
        flexShrink={0}
        boxShadow={invoice.status === 'paid' ? '0 0 6px rgba(57,255,20,0.5)' : 'none'}
      />

      <VStack
        align="start"
        spacing={0}
        flex={1}
        minW={0}
        cursor="pointer"
        onClick={() => onEdit(invoice)}
      >
        <HStack spacing={2}>
          <Text color="white" fontSize="sm" fontWeight="700" noOfLines={1}>
            {invoice.invoice_number || 'Draft Invoice'}
          </Text>
          <Badge
            fontSize="2xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.05em"
            px={2}
            py={0.5}
            borderRadius="full"
            bg={config.bg}
            color={config.color}
            border="1px solid"
            borderColor={config.border}
          >
            {config.label}
          </Badge>
        </HStack>
        <HStack spacing={2}>
          {invoice.client_name && (
            <Text color="surface.400" fontSize="xs" noOfLines={1}>{invoice.client_name}</Text>
          )}
          {invoice.project_name && (
            <>
              <Text color="surface.700" fontSize="xs">·</Text>
              <Text color="surface.500" fontSize="xs" noOfLines={1}>{invoice.project_name}</Text>
            </>
          )}
          {itemCount > 0 && (
            <>
              <Text color="surface.700" fontSize="xs">·</Text>
              <Text color="surface.600" fontSize="xs">{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </>
          )}
        </HStack>
      </VStack>

      <VStack align="end" spacing={0} flexShrink={0}>
        <Text color="white" fontSize="sm" fontWeight="700" fontFamily="mono">
          ${total.toLocaleString()}
        </Text>
        {paid > 0 && paid < total && (
          <Text color="accent.neon" fontSize="2xs" fontFamily="mono">
            ${paid.toLocaleString()} paid
          </Text>
        )}
        {paid >= total && total > 0 && (
          <Text color="accent.neon" fontSize="2xs" fontWeight="600">Paid</Text>
        )}
      </VStack>

      {/* Preview/Send button */}
      <Tooltip label={canSend ? 'Preview and send' : 'Preview invoice'} placement="top">
        <IconButton
          icon={canSend ? <TbSend /> : <TbEye />}
          size="xs"
          variant="ghost"
          color={canSend ? 'brand.500' : 'surface.500'}
          _hover={{ color: canSend ? 'brand.400' : 'white', bg: 'surface.800' }}
          onClick={(e) => { e.stopPropagation(); onPreview(invoice); }}
          aria-label="Preview"
        />
      </Tooltip>

      <Text color="surface.600" fontSize="2xs" fontFamily="mono" flexShrink={0} w="70px" textAlign="right">
        {invoice.created_at ? format(new Date(invoice.created_at), 'MMM d') : '--'}
      </Text>
    </HStack>
  );
};

const InvoiceList = ({ invoices, loading, onEdit, onPreview, onCreate }) => (
  <Box bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="xl">
    <HStack px={4} py={3} borderBottom="1px solid" borderColor="surface.800">
      <Box w="6px" h="6px" borderRadius="full" bg="accent.neon" boxShadow="0 0 6px rgba(57,255,20,0.4)" />
      <Text
        color="accent.neon"
        fontSize="xs"
        fontWeight="700"
        textTransform="uppercase"
        letterSpacing="0.1em"
        fontFamily="mono"
      >
        All Invoices
      </Text>
    </HStack>

    {loading ? (
      <Center py={12}>
        <Spinner size="md" color="accent.neon" thickness="2px" />
      </Center>
    ) : invoices.length === 0 ? (
      <Center py={12}>
        <VStack spacing={3}>
          <Icon as={TbFileInvoice} boxSize={8} color="surface.600" />
          <Text color="surface.400" fontSize="sm">No invoices yet</Text>
          <Text color="surface.600" fontSize="xs">Create a project first, then generate an invoice</Text>
          <Button
            size="sm"
            variant="outline"
            borderColor="accent.neon"
            color="accent.neon"
            onClick={onCreate}
            mt={1}
          >
            Create your first invoice
          </Button>
        </VStack>
      </Center>
    ) : (
      <VStack align="stretch" spacing={0} divider={<Divider borderColor="surface.850" />}>
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} onEdit={onEdit} onPreview={onPreview} />
        ))}
      </VStack>
    )}
  </Box>
);

export default InvoiceList;