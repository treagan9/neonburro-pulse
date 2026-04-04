// src/pages/Invoicing/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, useDisclosure } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import InvoicingHeader from './components/InvoicingHeader';
import RevenuePulse from './components/RevenuePulse';
import InvoiceList from './components/InvoiceList';
import InvoiceModal from './components/InvoiceModal';
import InvoicePreview from './components/InvoicePreview';

const Invoicing = () => {
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [invoicesRes, projectsRes, clientsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*, clients(name, email), projects(name, project_number), invoice_items(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, name, project_number, client_id, clients(name)')
        .in('status', ['active', 'proposal', 'lead'])
        .order('created_at', { ascending: false }),
      supabase
        .from('clients')
        .select('id, name, company, email')
        .eq('status', 'active')
        .order('name'),
    ]);

    const enriched = (invoicesRes.data || []).map((inv) => ({
      ...inv,
      client_name: inv.clients?.name || null,
      client_email: inv.clients?.email || null,
      project_name: inv.projects?.name || null,
      project_number: inv.projects?.project_number || null,
      line_items: inv.invoice_items || [],
    }));

    setInvoices(enriched);
    setProjects((projectsRes.data || []).map((p) => ({
      ...p,
      client_name: p.clients?.name || null,
    })));
    setClients(clientsRes.data || []);
    setLoading(false);
  };

  const handleCreate = () => { setEditingInvoice(null); onOpen(); };
  const handleEdit = (invoice) => { setEditingInvoice(invoice); onOpen(); };
  const handlePreview = (invoice) => { setPreviewInvoice(invoice); onPreviewOpen(); };

  const revenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_paid || 0), 0);
  const outstanding = invoices
    .filter((inv) => ['sent', 'viewed', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (parseFloat(inv.total || 0) - parseFloat(inv.total_paid || 0)), 0);
  const drafts = invoices.filter((inv) => inv.status === 'draft').length;

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={5} align="stretch">
        <InvoicingHeader count={invoices.length} onCreate={handleCreate} />
        <RevenuePulse revenue={revenue} outstanding={outstanding} drafts={drafts} loading={loading} />
        <InvoiceList
          invoices={invoices}
          loading={loading}
          onEdit={handleEdit}
          onPreview={handlePreview}
          onCreate={handleCreate}
        />
      </VStack>

      <InvoiceModal
        isOpen={isOpen}
        onClose={onClose}
        invoice={editingInvoice}
        projects={projects}
        clients={clients}
        onSave={fetchData}
      />

      <InvoicePreview
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        invoice={previewInvoice}
        onSent={fetchData}
      />
    </Box>
  );
};

export default Invoicing;