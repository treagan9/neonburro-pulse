// src/pages/Settings/components/SettingsNotifications.jsx
import { useState, useEffect } from 'react';
import {
  VStack, HStack, Text, Box, Icon, Switch, useToast,
  Spinner, Center, SimpleGrid,
} from '@chakra-ui/react';
import { TbMail, TbDeviceMobile, TbMoon } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const ToggleRow = ({ label, sub, value, onChange }) => (
  <HStack
    justify="space-between"
    py={3}
    px={3}
    borderRadius="lg"
    transition="all 0.15s"
    border="1px solid transparent"
    _hover={{ bg: 'rgba(255,255,255,0.02)', borderColor: 'surface.850' }}
    align="start"
  >
    <Box flex={1} pr={3}>
      <Text color="white" fontSize="sm" fontWeight="600">{label}</Text>
      {sub && <Text color="surface.500" fontSize="2xs" mt={0.5} lineHeight="1.4">{sub}</Text>}
    </Box>
    <Switch
      isChecked={value}
      onChange={(e) => onChange(e.target.checked)}
      colorScheme="cyan"
      size="md"
      sx={{
        '& .chakra-switch__track': {
          bg: 'surface.800',
          _checked: { bg: 'brand.500' },
        },
      }}
    />
  </HStack>
);

const SubsectionLabel = ({ icon, label, hint }) => (
  <HStack spacing={2} mb={2} px={3}>
    <Icon as={icon} boxSize={3.5} color="surface.500" />
    <Text fontSize="2xs" color="surface.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
      {label}
    </Text>
    {hint && (
      <Text fontSize="2xs" color="surface.700" fontFamily="mono">· {hint}</Text>
    )}
  </HStack>
);

const SettingsNotifications = ({ user }) => {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrefs();
  }, [user.id]);

  const fetchPrefs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notification_prefs')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setPrefs(data);
    } else {
      const { data: newData } = await supabase
        .from('notification_prefs')
        .insert({ user_id: user.id })
        .select()
        .single();
      setPrefs(newData);
    }
    setLoading(false);
  };

  const updatePref = async (field, value) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
    const { error } = await supabase
      .from('notification_prefs')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Save failed',
        description: error.message,
        status: 'error',
        duration: 2000,
      });
      setPrefs((prev) => ({ ...prev, [field]: !value }));
    }
  };

  if (loading || !prefs) {
    return (
      <Center py={4}>
        <Spinner size="sm" color="brand.500" thickness="2px" />
      </Center>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack spacing={2.5} px={1}>
        <Box w="6px" h="6px" borderRadius="full" bg="#8B5CF6" boxShadow="0 0 8px rgba(139,92,246,0.6)" />
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="#8B5CF6"
          fontFamily="mono"
        >
          Notifications
        </Text>
      </HStack>

      {/* Email - 2 column on desktop */}
      <Box>
        <SubsectionLabel icon={TbMail} label="Email" />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={1}>
          <ToggleRow
            label="Form submissions"
            sub="When someone fills out a contact form"
            value={prefs.notify_form_submission}
            onChange={(v) => updatePref('notify_form_submission', v)}
          />
          <ToggleRow
            label="Invoice viewed"
            sub="When a client opens their invoice"
            value={prefs.notify_invoice_viewed}
            onChange={(v) => updatePref('notify_invoice_viewed', v)}
          />
          <ToggleRow
            label="Payment received"
            sub="When an invoice gets paid"
            value={prefs.notify_invoice_paid}
            onChange={(v) => updatePref('notify_invoice_paid', v)}
          />
          <ToggleRow
            label="Invoice overdue"
            sub="Daily reminder for unpaid invoices past due"
            value={prefs.notify_invoice_overdue}
            onChange={(v) => updatePref('notify_invoice_overdue', v)}
          />
          <ToggleRow
            label="New client added"
            sub="When a new client is created"
            value={prefs.notify_new_client}
            onChange={(v) => updatePref('notify_new_client', v)}
          />
          <ToggleRow
            label="Team activity"
            sub="When teammates make changes"
            value={prefs.notify_team_activity}
            onChange={(v) => updatePref('notify_team_activity', v)}
          />
        </SimpleGrid>
      </Box>

      {/* SMS */}
      <Box>
        <SubsectionLabel
          icon={TbDeviceMobile}
          label="SMS"
          hint={!prefs.sms_enabled ? 'coming soon' : null}
        />
        <VStack spacing={1} align="stretch">
          <ToggleRow
            label="Enable SMS notifications"
            sub="Requires phone number on file"
            value={prefs.sms_enabled}
            onChange={(v) => updatePref('sms_enabled', v)}
          />
          {prefs.sms_enabled && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={1}>
              <ToggleRow
                label="Payment received"
                sub="Text me when an invoice gets paid"
                value={prefs.sms_invoice_paid}
                onChange={(v) => updatePref('sms_invoice_paid', v)}
              />
              <ToggleRow
                label="High value lead"
                sub="Text me for project briefs over $5k"
                value={prefs.sms_high_value_lead}
                onChange={(v) => updatePref('sms_high_value_lead', v)}
              />
            </SimpleGrid>
          )}
        </VStack>
      </Box>

      {/* Quiet hours */}
      <Box>
        <SubsectionLabel icon={TbMoon} label="Quiet Hours" />
        <ToggleRow
          label="Mute notifications at night"
          sub={prefs.quiet_hours_enabled
            ? `${prefs.quiet_hours_start?.slice(0, 5)} - ${prefs.quiet_hours_end?.slice(0, 5)}`
            : '10:00 PM - 7:00 AM'}
          value={prefs.quiet_hours_enabled}
          onChange={(v) => updatePref('quiet_hours_enabled', v)}
        />
      </Box>
    </VStack>
  );
};

export default SettingsNotifications;