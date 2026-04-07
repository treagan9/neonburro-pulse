// src/pages/Settings/components/SettingsNotifications.jsx
import { useState, useEffect } from 'react';
import {
  VStack, HStack, Text, Box, Icon, Switch, useToast, Spinner, Center,
} from '@chakra-ui/react';
import { TbBell, TbMail, TbDeviceMobile, TbMoon } from 'react-icons/tb';
import { supabase } from '../../../lib/supabase';

const ToggleRow = ({ label, sub, value, onChange }) => (
  <HStack
    justify="space-between"
    py={2.5}
    px={3}
    borderRadius="lg"
    transition="all 0.15s"
    _hover={{ bg: 'surface.850' }}
  >
    <Box flex={1} pr={3}>
      <Text color="white" fontSize="sm" fontWeight="600">{label}</Text>
      {sub && <Text color="surface.500" fontSize="2xs" mt={0.5}>{sub}</Text>}
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
      // Create default if missing
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
      // Revert
      setPrefs((prev) => ({ ...prev, [field]: !value }));
    }
  };

  if (loading || !prefs) {
    return (
      <Box bg="surface.900" border="1px solid" borderColor="surface.800" borderRadius="2xl" p={5}>
        <Center py={4}>
          <Spinner size="sm" color="brand.500" thickness="2px" />
        </Center>
      </Box>
    );
  }

  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="2xl"
      p={5}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        right={0}
        w="200px"
        h="200px"
        bg="radial-gradient(circle at top right, rgba(139,92,246,0.06), transparent 60%)"
        pointerEvents="none"
      />

      <VStack spacing={5} align="stretch" position="relative">
        <HStack spacing={2}>
          <Box w="6px" h="6px" borderRadius="full" bg="#8B5CF6" boxShadow="0 0 8px rgba(139,92,246,0.6)" />
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="#8B5CF6"
            fontFamily="mono"
          >
            Notifications
          </Text>
        </HStack>

        {/* Email section */}
        <Box>
          <HStack spacing={2} mb={2} px={3}>
            <Icon as={TbMail} boxSize={3.5} color="surface.500" />
            <Text fontSize="2xs" color="surface.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
              Email
            </Text>
          </HStack>
          <VStack spacing={0} align="stretch">
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
          </VStack>
        </Box>

        {/* SMS section */}
        <Box>
          <HStack spacing={2} mb={2} px={3}>
            <Icon as={TbDeviceMobile} boxSize={3.5} color="surface.500" />
            <Text fontSize="2xs" color="surface.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
              SMS
            </Text>
            {!prefs.sms_enabled && (
              <Text fontSize="2xs" color="surface.700" fontFamily="mono">· coming soon</Text>
            )}
          </HStack>
          <VStack spacing={0} align="stretch">
            <ToggleRow
              label="Enable SMS notifications"
              sub="Requires phone number on file"
              value={prefs.sms_enabled}
              onChange={(v) => updatePref('sms_enabled', v)}
            />
            {prefs.sms_enabled && (
              <>
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
              </>
            )}
          </VStack>
        </Box>

        {/* Quiet hours */}
        <Box>
          <HStack spacing={2} mb={2} px={3}>
            <Icon as={TbMoon} boxSize={3.5} color="surface.500" />
            <Text fontSize="2xs" color="surface.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em">
              Quiet Hours
            </Text>
          </HStack>
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
    </Box>
  );
};

export default SettingsNotifications;