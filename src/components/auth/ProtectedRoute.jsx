// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center h="100vh" bg="surface.950">
        <Spinner size="xl" color="brand.500" thickness="3px" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login/" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
