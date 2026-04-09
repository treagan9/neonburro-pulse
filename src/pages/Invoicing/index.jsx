// src/pages/Invoicing/index.jsx
// Split-pane layout: invoice list on left, inline editor on right
// When nothing selected: shows filters + list
// When invoice selected: shows editor with Compose/Preview tabs
// Supports ?invoice=ID, ?client=ID, ?new=true query params

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Container, Icon, Spinner, Center,
  Button, Input, useToast,
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TbPlus, TbSearch, TbX } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import InvoiceList from './components/InvoiceList';
import InvoiceEditor from './components/InvoiceEditor';

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};

const Invoicing = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Load the selected invoice from URL on mount
  useEffect(() => {
    const invoiceParam = searchParams.get('invoice');
    if (invoiceParam) setSelectedInvoiceId(invoiceParam);
  }, [searchParams]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, invoice_items(*), clients(id, name, company, email, phone)')
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id, name, company, email, phone, status')
        .order('name'),
    ]);

    setInvoices(invoicesRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  };

  const handleNewInvoice = () => {
    const clientId = searchParams.get('client');
    setSelectedInvoiceId('new');
    setSearchParams({ invoice: 'new', ...(clientId ? { client: clientId } : {}) });
  };

  const handleSelectInvoice = (id) => {
    setSelectedInvoiceId(id);
    setSearchParams({ invoice: id });
  };

  const handleCloseEditor = () => {
    setSelectedInvoiceId(null);
    setSearchParams({});
  };

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const matchSearch = search
      ? inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        inv.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.clients?.company?.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    totalOutstanding: invoices
      .filter((inv) => ['sent', 'viewed', 'overdue', 'partial'].includes(inv.status))
      .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0),
    mtdRevenue: invoices
      .filter((inv) => {
        const paidAt = inv.paid_at ? new Date(inv.paid_at) : null;
        if (!paidAt) return false;
        const now = new Date();
        return paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth();
      })
      .reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0),
    drafts: invoices.filter((inv) => inv.status === 'draft').length,
    totalCount: invoices.length,
  };

  const counts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    partial: invoices.filter((i) => i.status === 'partial').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
  };

  // If an invoice is selected, show the editor
  if (selectedInvoiceId) {
    return (
      <InvoiceEditor
        invoiceId={selectedInvoiceId === 'new' ? null : selectedInvoiceId}
        clientId={searchParams.get('client')}
        clients={clients}
        onClose={handleCloseEditor}
        onSaved={fetchData}
      />
    );
  }

  return (
    <Box position="relative" minH="100%">
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="400px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.025), transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="1100px" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} position="relative">
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          {/* Header */}
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
              <Box>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="800"
                  color="white"
                  letterSpacing="-0.02em"
                  lineHeight="1"
                >
                  Invoicing
                </Text>
              </Box>
              <HStack
                spacing={1.5}
                cursor="pointer"
                onClick={handleNewInvoice}
                color="brand.500"
                opacity={0.8}
                _hover={{ opacity: 1, transform: 'translateY(-1px)' }}
                transition="all 0.15s"
              >
                <Icon as={TbPlus} boxSize={3.5} />
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
                  New Invoice
                </Text>
              </HStack>
            </HStack>

            {/* Inline stat strip */}
            <HStack spacing={0} color="surface.500" fontSize="xs" fontFamily="mono" flexWrap="wrap">
              <Text color="white" fontWeight="700">{stats.totalCount}</Text>
              <Text color="surface.600" mx={1.5}>invoices</Text>
              <Text color="surface.700" mx={1}>·</Text>
              <Text color="white" fontWeight="700">{currency(stats.mtdRevenue)}</Text>
              <Text color="surface.600" mx={1.5}>MTD</Text>
              {stats.totalOutstanding > 0 && (
                <>
                  <Text color="surface.700" mx={1}>·</Text>
                  <Text color="accent.banana" fontWeight="700">{currency(stats.totalOutstanding)}</Text>
                  <Text color="surface.600" mx={1.5}>outstanding</Text>
                </>
              )}
              {stats.drafts > 0 && (
                <>
                  <Text color="surface.700" mx={1}>·</Text>
                  <Text color="surface.400" fontWeight="700">{stats.drafts}</Text>
                  <Text color="surface.600" mx={1.5}>draft{stats.drafts !== 1 ? 's' : ''}</Text>
                </>
              )}
            </HStack>
          </VStack>

          {/* Filters */}
          <HStack spacing={6} flexWrap="wrap" align="center">
            <Box flex={1} minW="240px" maxW="400px" position="relative">
              <Icon
                as={TbSearch}
                position="absolute"
                left={0}
                top="50%"
                transform="translateY(-50%)"
                color="surface.600"
                boxSize={3.5}
                zIndex={1}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices"
                pl={6}
                bg="transparent"
                border="none"
                borderBottom="1px solid"
                borderColor="surface.800"
                borderRadius={0}
                color="white"
                fontSize="sm"
                h="40px"
                _hover={{ borderColor: 'surface.700' }}
                _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
                _placeholder={{ color: 'surface.600' }}
              />
            </Box>

            <HStack spacing={4}>
              {[
                { value: 'all', label: 'All' },
                { value: 'draft', label: 'Drafts' },
                { value: 'sent', label: 'Sent' },
                { value: 'partial', label: 'Partial' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
              ].map((opt) => {
                const active = filterStatus === opt.value;
                const count = counts[opt.value] || 0;
                return (
                  <Box
                    key={opt.value}
                    cursor="pointer"
                    onClick={() => setFilterStatus(opt.value)}
                    position="relative"
                    pb={1}
                  >
                    <HStack spacing={1.5}>
                      <Text
                        fontSize="xs"
                        fontWeight="700"
                        color={active ? 'white' : 'surface.600'}
                        _hover={!active ? { color: 'surface.400' } : {}}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        fontSize="2xs"
                        color={active ? 'brand.500' : 'surface.700'}
                        fontFamily="mono"
                        fontWeight="700"
                      >
                        {count}
                      </Text>
                    </HStack>
                    {active && (
                      <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        h="2px"
                        bg="brand.500"
                        borderRadius="full"
                        boxShadow="0 0 8px rgba(0,229,229,0.6)"
                      />
                    )}
                  </Box>
                );
              })}
            </HStack>
          </HStack>

          {/* Invoice list */}
          <InvoiceList
            invoices={filtered}
            loading={loading}
            onSelect={handleSelectInvoice}
            onNew={handleNewInvoice}
          />
        </VStack>
      </Container>
    </Box>
  );
};

export default Invoicing;