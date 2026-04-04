// src/pages/Invoicing/index.jsx
import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Button, Icon, Badge,
  SimpleGrid, Center, Spinner, Divider,
} from '@chakra-ui/react';
import {
  TbPlus, TbFileInvoice, TbMail, TbCheck,
  TbClock, TbAlertTriangle, TbCoin,
} from 'react-icons/tb';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     icon: TbFileInvoice, color: 'surface.500', bg: 'rgba(128,128,128,0.08)', border: 'rgba(128,128,128,0.25)' },
  sent:      { label: 'Sent',      icon: TbMail,        color: 'brand.500',   bg: 'rgba(0,229,229,0.08)',   border: 'rgba(0,229,229,0.25)' },
  viewed:    { label: 'Viewed',    icon: TbClock,       color: 'accent.banana', bg: 'rgba(255,229,0,0.08)', border: 'rgba(255,229,0,0.25)' },
  paid:      { label: 'Paid',      icon: TbCheck,       color: 'accent.neon', bg: 'rgba(57,255,20,0.08)',   border: 'rgba(57,255,20,0.25)' },
  overdue:   { label: 'Overdue',   icon: TbAlertTriangle, color: 'status.red', bg: 'rgba(255,51,102,0.08)', border: 'rgba(255,51,102,0.25)' },
  cancelled: { label: 'Cancelled', icon: TbFileInvoice, color: 'surface.600', bg: 'rgba(128,128,128,0.06)', border: 'rgba(128,128,128,0.15)' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
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
  );
};

const SummaryCard = ({ label, value, icon, accent }) => (
  <Box
    bg="surface.900"
    border="1px solid"
    borderColor="surface.800"
    borderRadius="xl"
    overflow="hidden"
  >
    <Box h="2px" bg={accent} />
    <Box p={4}>
      <HStack spacing={3}>
        <Icon as={icon} boxSize={5} color={accent} />
        <Box>
          <Text color="surface.500" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
            {label}
          </Text>
          <Text color="white" fontSize="xl" fontWeight="700" fontFamily="mono" lineHeight="1.2">
            {value}
          </Text>
        </Box>
      </HStack>
    </Box>
  </Box>
);

const InvoiceRow = ({ invoice }) => {
  const config = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const total = parseFloat(invoice.total || 0);
  const paid = parseFloat(invoice.total_paid || 0);

  return (
    <HStack
      py={3.5}
      px={4}
      spacing={4}
      transition="all 0.15s"
      cursor="pointer"
      borderRadius="lg"
      _hover={{ bg: 'surface.850' }}
    >
      <Icon as={config.icon} boxSize={4} color={config.color} flexShrink={0} />

      <VStack align="start" spacing={0} flex={1} minW={0}>
        <HStack spacing={2}>
          <Text color="white" fontSize="sm" fontWeight="600" noOfLines={1}>
            {invoice.invoice_number || 'Draft'}
          </Text>
          <StatusBadge status={invoice.status} />
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
          <Text color="accent.neon" fontSize="2xs" fontWeight="600">
            Paid
          </Text>
        )}
      </VStack>

      <Text color="surface.600" fontSize="2xs" fontFamily="mono" flexShrink={0} w="70px" textAlign="right">
        {invoice.created_at ? format(new Date(invoice.created_at), 'MMM d') : '--'}
      </Text>
    </HStack>
  );
};

const Invoicing = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(name), projects(name)')
      .order('created_at', { ascending: false });

    const enriched = (data || []).map((inv) => ({
      ...inv,
      client_name: inv.clients?.name || null,
      project_name: inv.projects?.name || null,
    }));

    setInvoices(enriched);
    setLoading(false);
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);
  const draftCount = invoices.filter((inv) => inv.status === 'draft').length;

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={5} align="stretch">

        {/* Header */}
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Box>
            <Text fontSize="2xl" fontWeight="700" color="white">Invoicing</Text>
            <Text color="surface.400" fontSize="sm" mt={0.5}>
              {invoices.length} total invoices
            </Text>
          </Box>
          <Button
            leftIcon={<TbPlus />}
            size="sm"
            bg="accent.neon"
            color="surface.950"
            fontWeight="700"
            borderRadius="lg"
            _hover={{ bg: '#2EE60D', transform: 'translateY(-1px)' }}
            isDisabled
          >
            New Invoice
          </Button>
        </HStack>

        {/* Summary cards */}
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          <SummaryCard
            label="Revenue Collected"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={TbCoin}
            accent="#39FF14"
          />
          <SummaryCard
            label="Outstanding"
            value={`$${totalOutstanding.toLocaleString()}`}
            icon={TbClock}
            accent="#FFE500"
          />
          <SummaryCard
            label="Drafts"
            value={draftCount}
            icon={TbFileInvoice}
            accent="#00E5E5"
          />
        </SimpleGrid>

        {/* Invoice list */}
        <Box
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
        >
          {loading ? (
            <Center py={12}>
              <Spinner size="lg" color="accent.neon" thickness="3px" />
            </Center>
          ) : invoices.length === 0 ? (
            <Center py={12}>
              <VStack spacing={2}>
                <Icon as={TbFileInvoice} boxSize={8} color="surface.600" />
                <Text color="surface.400" fontSize="sm">No invoices yet</Text>
                <Text color="surface.600" fontSize="xs">
                  Create a project first, then generate an invoice
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack align="stretch" spacing={0} divider={<Divider borderColor="surface.800" />}>
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default Invoicing;