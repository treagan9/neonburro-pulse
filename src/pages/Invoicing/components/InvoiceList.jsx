// src/pages/Invoicing/components/InvoiceList.jsx
// Row-based invoice list. Eye icon for snapshot viewing (sent invoices).
// Trash icon for drafts (hard delete with two-click confirm).

import { useState } from 'react';
import {
  Box, HStack, VStack, Text, Icon, Center, Spinner, Button,
} from '@chakra-ui/react';
import {
  TbCash, TbBolt, TbTrash, TbAlertTriangle, TbEye,
} from 'react-icons/tb';
import { getInitials, getAvatarColor, timeAgo } from '../../../utils/phone';
import InvoiceSnapshotModal from './InvoiceSnapshotModal';

const STATUS_COLORS = {
  draft:   { color: '#737373', label: 'DRAFT' },
  sent:    { color: '#00E5E5', label: 'SENT' },
  viewed:  { color: '#FFE500', label: 'VIEWED' },
  partial: { color: '#FFE500', label: 'PARTIAL' },
  overdue: { color: '#FF3366', label: 'OVERDUE' },
  paid:    { color: '#39FF14', label: 'PAID' },
};

const SENT_LIKE_STATUSES = ['sent', 'viewed', 'partial', 'overdue', 'paid'];

const currency = (val) => {
  const num = parseFloat(val || 0);
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${num.toLocaleString()}`;
};

const InvoiceRow = ({ invoice, onSelect, onQuickDelete, onViewSnapshot }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const client = invoice.clients;
  const status = STATUS_COLORS[invoice.status] || STATUS_COLORS.draft;
  const avatarColor = getAvatarColor(client?.name || '');
  const initials = getInitials(client?.name || '?');
  const sprintCount = invoice.invoice_items?.length || 0;
  const paidCount = (invoice.invoice_items || []).filter(
    (i) => i.payment_status === 'paid' || i.locked
  ).length;
  const outstanding = parseFloat(invoice.total || 0) - parseFloat(invoice.total_paid || 0);
  const isDraft = invoice.status === 'draft';
  const wasSent = SENT_LIKE_STATUSES.includes(invoice.status);

  const handleTrashClick = (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onQuickDelete(invoice.id);
  };

  const handleEyeClick = (e) => {
    e.stopPropagation();
    onViewSnapshot(invoice.id);
  };

  return (
    <Box
      py={3.5}
      pl={4}
      pr={4}
      borderBottom="1px solid"
      borderColor="surface.900"
      borderLeft="2px solid"
      borderLeftColor="transparent"
      cursor="pointer"
      transition="all 0.15s ease-out"
      role="group"
      onClick={() => onSelect(invoice.id)}
      _hover={{
        borderLeftColor: status.color,
        bg: 'rgba(255,255,255,0.015)',
        transform: 'translateX(2px)',
      }}
    >
      <HStack spacing={4} align="center">
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg={status.color}
          boxShadow={invoice.status === 'paid' ? `0 0 8px ${status.color}80` : 'none'}
          flexShrink={0}
        />

        <Box
          w="32px"
          h="32px"
          borderRadius="full"
          bg={avatarColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text color="surface.950" fontSize="2xs" fontWeight="800">
            {initials}
          </Text>
        </Box>

        <VStack align="start" spacing={0} flex={1} minW={0}>
          <HStack spacing={2}>
            <Text color="white" fontSize="sm" fontWeight="700" fontFamily="mono">
              {invoice.invoice_number || 'NEW'}
            </Text>
            <Text
              fontSize="2xs"
              fontWeight="700"
              color={status.color}
              letterSpacing="0.05em"
              fontFamily="mono"
            >
              {status.label}
            </Text>
          </HStack>
          <Text color="surface.500" fontSize="xs" noOfLines={1}>
            {client?.name || 'No client'}
            {client?.company && ` · ${client.company}`}
          </Text>
        </VStack>

        <HStack spacing={1.5} display={{ base: 'none', md: 'flex' }}>
          <Icon as={TbBolt} boxSize={3} color="surface.600" />
          <Text color="surface.400" fontSize="xs" fontFamily="mono" fontWeight="700">
            {paidCount}/{sprintCount}
          </Text>
        </HStack>

        <VStack align="end" spacing={0} minW="80px">
          <Text color="white" fontSize="sm" fontFamily="mono" fontWeight="700">
            {currency(invoice.total)}
          </Text>
          {outstanding > 0 && invoice.status !== 'draft' && (
            <Text color="accent.banana" fontSize="2xs" fontFamily="mono">
              {currency(outstanding)} due
            </Text>
          )}
        </VStack>

        <Text
          color="surface.700"
          fontSize="2xs"
          fontFamily="mono"
          minW="60px"
          textAlign="right"
          display={{ base: 'none', lg: 'block' }}
        >
          {timeAgo(invoice.sent_at || invoice.created_at)}
        </Text>

        {/* Action icons - eye + trash, hover-revealed */}
        <HStack spacing={0.5}>
          {/* Eye icon - sent invoices only */}
          {wasSent ? (
            <Box
              as="button"
              onClick={handleEyeClick}
              opacity={0}
              color="surface.600"
              p={1.5}
              borderRadius="md"
              transition="all 0.15s"
              _groupHover={{ opacity: 0.6 }}
              _hover={{
                opacity: '1 !important',
                color: 'brand.500',
                bg: 'rgba(0,229,229,0.08)',
              }}
              title="View sent email"
            >
              <Icon as={TbEye} boxSize={3.5} />
            </Box>
          ) : (
            <Box w="28px" />
          )}

          {/* Trash icon - drafts only */}
          {isDraft ? (
            <Box
              as="button"
              onClick={handleTrashClick}
              opacity={confirmDelete ? 1 : 0}
              color={confirmDelete ? 'red.400' : 'surface.600'}
              p={1.5}
              borderRadius="md"
              transition="all 0.15s"
              _groupHover={{ opacity: confirmDelete ? 1 : 0.6 }}
              _hover={{
                opacity: '1 !important',
                color: 'red.400',
                bg: 'rgba(255,51,102,0.08)',
              }}
              title={confirmDelete ? 'Click again to confirm' : 'Delete draft'}
            >
              <Icon as={confirmDelete ? TbAlertTriangle : TbTrash} boxSize={3.5} />
            </Box>
          ) : (
            <Box w="28px" />
          )}
        </HStack>
      </HStack>
    </Box>
  );
};

const InvoiceList = ({ invoices, loading, onSelect, onNew, onQuickDelete }) => {
  const [snapshotInvoiceId, setSnapshotInvoiceId] = useState(null);

  if (loading) {
    return (
      <Center py={16}>
        <VStack spacing={3}>
          <Spinner size="md" color="brand.500" thickness="2px" />
          <Text color="surface.600" fontSize="xs" fontFamily="mono">
            Loading invoices
          </Text>
        </VStack>
      </Center>
    );
  }

  if (invoices.length === 0) {
    return (
      <Box py={20} textAlign="center">
        <VStack spacing={4}>
          <Icon as={TbCash} boxSize={10} color="surface.700" />
          <VStack spacing={1}>
            <Text color="white" fontSize="md" fontWeight="700">
              No invoices yet
            </Text>
            <Text color="surface.500" fontSize="xs">
              Create your first invoice to start billing
            </Text>
          </VStack>
          <Button
            size="sm"
            variant="outline"
            borderColor="brand.500"
            color="brand.500"
            fontWeight="700"
            borderRadius="full"
            onClick={onNew}
            mt={2}
            _hover={{ bg: 'rgba(0,229,229,0.08)' }}
          >
            Create Invoice
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <Box borderTop="1px solid" borderColor="surface.900">
        {invoices.map((inv) => (
          <InvoiceRow
            key={inv.id}
            invoice={inv}
            onSelect={onSelect}
            onQuickDelete={onQuickDelete}
            onViewSnapshot={setSnapshotInvoiceId}
          />
        ))}
      </Box>

      <InvoiceSnapshotModal
        isOpen={!!snapshotInvoiceId}
        onClose={() => setSnapshotInvoiceId(null)}
        invoiceId={snapshotInvoiceId}
      />
    </>
  );
};

export default InvoiceList;