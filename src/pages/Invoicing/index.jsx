// src/pages/Invoicing/index.jsx
// New design language: no big title, kicker only, teal-filled + Invoice button,
// sticky rounded search bar, tab system from uiConstants.
// AppShell handles width/gutters.

import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Input,
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { TbPlus, TbSearch } from 'react-icons/tb';
import { supabase } from '../../lib/supabase';
import { SENT_STATUSES, formatCurrencyCompact } from '../../lib/invoiceConstants';
import {
  PRIMARY_BUTTON_PROPS,
  SEARCH_INPUT_WRAP_PROPS,
  SEARCH_INPUT_PROPS,
  buildFilterTabProps,
  FILTER_TAB_LABEL_PROPS,
  FILTER_TAB_COUNT_PROPS,
  FILTER_TAB_UNDERLINE_PROPS,
  PAGE_AMBIENT_GLOW_PROPS,
} from '../../lib/uiConstants';
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

  const FILTER_OPTIONS = [
    { value: 'all',   label: 'All' },
    { value: 'draft', label: 'Drafts' },
    { value: 'sent',  label: 'Sent' },
    { value: 'paid',  label: 'Paid' },
  ];

  return (
    <Box position="relative" minH="100%">
      <Box {...PAGE_AMBIENT_GLOW_PROPS} />

      <VStack spacing={{ base: 8, md: 12 }} align="stretch" position="relative">
        {/* Header - kicker + teal button + stats */}
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Text textStyle="kicker">Invoicing</Text>

            <Box as="button" onClick={handleNewInvoice} {...PRIMARY_BUTTON_PROPS}>
              <Icon as={TbPlus} boxSize={3.5} />
              <Text>Invoice</Text>
            </Box>
          </HStack>

          <HStack spacing={0} color="surface.500" fontSize="xs" fontFamily="mono" flexWrap="wrap" rowGap={1}>
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

        {/* Sticky rounded search */}
        <Box {...SEARCH_INPUT_WRAP_PROPS}>
          <Icon as={TbSearch} boxSize={4} color="surface.500" flexShrink={0} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number, client, or company"
            {...SEARCH_INPUT_PROPS}
          />
        </Box>

        {/* Filter row */}
        <HStack spacing={6} flexWrap="wrap" align="center">
          {FILTER_OPTIONS.map((opt) => {
            const active = filterStatus === opt.value;
            const count = counts[opt.value] || 0;
            return (
              <Box key={opt.value} onClick={() => setFilterStatus(opt.value)} {...buildFilterTabProps(active)}>
                <HStack spacing={2}>
                  <Text {...FILTER_TAB_LABEL_PROPS(active)}>{opt.label}</Text>
                  <Text {...FILTER_TAB_COUNT_PROPS(active)}>{count}</Text>
                </HStack>
                {active && <Box {...FILTER_TAB_UNDERLINE_PROPS} />}
              </Box>
            );
          })}
        </HStack>

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
