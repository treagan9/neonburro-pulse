// src/pages/Dashboard/components/QuickActions.jsx
import { HStack, Box, Text, Icon } from '@chakra-ui/react';
import { TbPlus, TbUsers, TbRocket, TbFileInvoice } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

const actions = [
  { label: 'New Client',  icon: TbUsers,        path: '/clients/',   accent: '#00E5E5' },
  { label: 'New Project', icon: TbRocket,       path: '/projects/',  accent: '#8B5CF6' },
  { label: 'New Invoice', icon: TbFileInvoice,  path: '/invoicing/', accent: '#39FF14' },
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
          borderRadius="lg"
          cursor="pointer"
          transition="all 0.15s"
          onClick={() => navigate(action.path)}
          flexShrink={0}
          _hover={{
            borderColor: action.accent,
            bg: `${action.accent}08`,
            transform: 'translateY(-1px)',
          }}
        >
          <HStack spacing={2.5}>
            <Icon as={TbPlus} boxSize={3.5} color={action.accent} />
            <Text color="surface.300" fontSize="sm" fontWeight="600">
              {action.label}
            </Text>
          </HStack>
        </Box>
      ))}
    </HStack>
  );
};

export default QuickActions;