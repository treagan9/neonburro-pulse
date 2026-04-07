// src/pages/Dashboard/components/QuickActions.jsx
import { HStack, Box, Text, Icon } from '@chakra-ui/react';
import { TbPlus, TbUsers, TbRocket, TbBolt } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'New Client',  icon: TbUsers,  path: '/clients/',   accent: '#00E5E5' },
  { label: 'New Project', icon: TbRocket, path: '/projects/',  accent: '#8B5CF6' },
  { label: 'New Invoice', icon: TbBolt,   path: '/invoicing/', accent: '#39FF14' },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <HStack spacing={3} overflowX="auto" pb={1}>
      {actions.map((action) => (
        <Box
          key={action.label}
          px={4}
          py={3}
          bg="surface.900"
          border="1px solid"
          borderColor="surface.800"
          borderRadius="xl"
          cursor="pointer"
          transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          onClick={() => navigate(action.path)}
          flexShrink={0}
          position="relative"
          overflow="hidden"
          role="group"
          _hover={{
            borderColor: `${action.accent}50`,
            transform: 'translateY(-1px)',
          }}
        >
          {/* Subtle gradient bloom */}
          <Box
            position="absolute"
            inset={0}
            bg={`linear-gradient(135deg, ${action.accent}08, transparent 60%)`}
            opacity={0}
            transition="opacity 0.3s"
            _groupHover={{ opacity: 1 }}
            pointerEvents="none"
          />
          <HStack spacing={2.5} position="relative">
            <Box
              p={1}
              borderRadius="md"
              bg={`${action.accent}15`}
              transition="all 0.3s"
              _groupHover={{ bg: `${action.accent}25` }}
            >
              <Icon as={action.icon} boxSize={3.5} color={action.accent} />
            </Box>
            <Text color="surface.300" fontSize="sm" fontWeight="600" _groupHover={{ color: 'white' }} transition="color 0.2s">
              {action.label}
            </Text>
            <Icon as={TbPlus} boxSize={3} color="surface.600" _groupHover={{ color: action.accent }} transition="color 0.2s" />
          </HStack>
        </Box>
      ))}
    </HStack>
  );
};

export default QuickActions;