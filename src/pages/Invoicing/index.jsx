// src/pages/Invoicing/index.jsx
// Invoicing page - aligned with Dashboard/Forms layout rhythm.
// No inner Container; AppShell handles width and gutters.
// Section spacing matches Dashboard: { base: 8, md: 12 }.
// Tabs: All / Drafts / Sent (sent/viewed/partial/overdue) / Paid.
// Filters out cancelled invoices everywhere.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Input,
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { TbPlus, TbSearch } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { SENT_STATUSES, formatCurrencyCompact } from '../../lib/invoiceConstants';
import InvoiceList from './components/InvoiceList';
import InvoiceEditor from './components/InvoiceEditor';

const Invoicing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

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
        .is('cancelled_at', null)
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

  // Quick delete from row (drafts only - hard delete)
  const handleQuickDelete = async (invoiceId) => {
    try {
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('activity_log').insert({
        user_id: user?.id,
        action: 'invoice_deleted',
        entity_type: 'invoice',
        entity_id: invoiceId,
        metadata: { hard_delete: true },
        created_at: new Date().toISOString(),
      });

      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const matchSearch = search
      ? inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        inv.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.clients?.company?.toLowerCase().includes(search.toLowerCase())
      : true;

    let matchStatus = true;
    if (filterStatus === 'draft') matchStatus = inv.status === 'draft';
    else if (filterStatus === 'sent') matchStatus = SENT_STATUSES.includes(inv.status);
    else if (filterStatus === 'paid') matchStatus = inv.status === 'paid';

    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    totalOutstanding: invoices
      .filter((inv) => SENT_STATUSES.includes(inv.status))
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
    sent: invoices.filter((i) => SENT_STATUSES.includes(i.status)).length,
    paid: invoices.filter((i) => i.status === 'paid').length,
  };

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
      {/* Ambient background - matches Dashboard */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="500px"
        bg="radial-gradient(ellipse at top center, rgba(0,229,229,0.04), transparent 70%)"
        pointerEvents="none"
      />

      <VStack spacing={{ base: 8, md: 12 }} align="stretch" position="relative">
        {/* Header */}
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" align="flex-end" flexWrap="wrap" gap={3}>
            <Text
              fontSize={{ base: '2xl', md: '3xl' }}
              fontWeight="800"
              color="white"
              letterSpacing="-0.02em"
              lineHeight="1"
            >
              Invoicing
            </Text>
            <HStack
              spacing={1.5}
              cursor="pointer"
              onClick={handleNewInvoice}
              color="brand.500"
              opacity={0.8}
              _hover={{ opacity: 1, transform: 'translateY(-1px)' }}
              transition="all 0.15s"
              userSelect="none"
            >
              <Icon as={TbPlus} boxSize={3.5} />
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em" textTransform="uppercase">
                New Invoice
              </Text>
            </HStack>
          </HStack>

          {/* Inline stats */}
          <HStack spacing={0} color="surface.500" fontSize="xs" fontFamily="mono" flexWrap="wrap">
            <Text color="white" fontWeight="700">{stats.totalCount}</Text>
            <Text color="surface.600" mx={1.5}>invoices</Text>
            <Text color="surface.700" mx={1}>·</Text>
            <Text color="white" fontWeight="700">{formatCurrencyCompact(stats.mtdRevenue)}</Text>
            <Text color="surface.600" mx={1.5}>MTD</Text>
            {stats.totalOutstanding > 0 && (
              <>
                <Text color="surface.700" mx={1}>·</Text>
                <Text color="accent.banana" fontWeight="700">{formatCurrencyCompact(stats.totalOutstanding)}</Text>
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

        {/* Filters - collapsed to 4 tabs */}
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

          <HStack spacing={5}>
            {[
              { value: 'all', label: 'All' },
              { value: 'draft', label: 'Drafts' },
              { value: 'sent', label: 'Sent' },
              { value: 'paid', label: 'Paid' },
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
          onQuickDelete={handleQuickDelete}
        />
      </VStack>
    </Box>
  );
};

export default Invoicing;
