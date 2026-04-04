// src/components/Layout/Header.jsx
import { Box, HStack, Text, IconButton, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { TbLogout, TbUser } from 'react-icons/tb';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login/');
  };

  return (
    <Box
      h="56px"
      borderBottom="1px solid"
      borderColor="surface.800"
      bg="surface.950"
      px={{ base: 4, md: 6 }}
      display="flex"
      alignItems="center"
      justifyContent="flex-end"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<TbUser />}
          variant="ghost"
          color="surface.400"
          size="sm"
          _hover={{ color: 'white', bg: 'surface.850' }}
          aria-label="Account"
        />
        <MenuList bg="surface.900" borderColor="surface.700" py={1}>
          <MenuItem
            bg="transparent"
            _hover={{ bg: 'surface.800' }}
            fontSize="sm"
            color="surface.300"
            isDisabled
          >
            {user?.email}
          </MenuItem>
          <MenuItem
            bg="transparent"
            _hover={{ bg: 'surface.800' }}
            icon={<TbLogout />}
            fontSize="sm"
            color="surface.300"
            onClick={handleSignOut}
          >
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default Header;
