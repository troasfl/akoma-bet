import React, { ReactNode, useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useColorModeValue,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  ChevronRightIcon,
  SettingsIcon,
  BellIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardStore } from '../../stores/dashboardStore';
import { NavigationItem, BreadcrumbItem as BreadcrumbItemType } from '../../types/dashboard';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItemType[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    isActive: true,
    isVisible: true
  },
  {
    id: 'credentials',
    label: 'Credentials',
    icon: 'lock',
    path: '/credentials',
    isActive: false,
    isVisible: true
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: 'play',
    path: '/automation',
    isActive: false,
    isVisible: true
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: 'list',
    path: '/activities',
    isActive: false,
    isVisible: true
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    isActive: false,
    isVisible: true
  }
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Dashboard',
  breadcrumbs = []
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const { user, logout } = useAuthStore();
  const { error, clearError } = useDashboardStore();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Update active navigation based on current path
  const activeNavigation = navigationItems.map(item => ({
    ...item,
    isActive: location.pathname === item.path
  }));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const SidebarContent = () => (
    <VStack spacing={0} align="stretch" h="full">
      {/* Logo/Brand */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <HStack>
          <Box
            w={8}
            h={8}
            bg="blue.500"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" fontWeight="bold" fontSize="sm">
              AB
            </Text>
          </Box>
          <Text fontWeight="bold" fontSize="lg">
            Akoma Bet
          </Text>
        </HStack>
      </Box>

      {/* Navigation */}
      <VStack spacing={1} p={4} flex={1}>
        {activeNavigation.map((item) => (
          <Box
            key={item.id}
            w="full"
            p={3}
            borderRadius="md"
            cursor="pointer"
            bg={item.isActive ? 'blue.500' : 'transparent'}
            color={item.isActive ? 'white' : 'inherit'}
            _hover={{
              bg: item.isActive ? 'blue.600' : useColorModeValue('gray.100', 'gray.700')
            }}
            onClick={() => handleNavigation(item.path)}
          >
            <HStack>
              <Box w={4} h={4} />
              <Text fontWeight="medium">{item.label}</Text>
            </HStack>
          </Box>
        ))}
      </VStack>

      {/* User Profile */}
      <Box p={4} borderTop="1px" borderColor={borderColor}>
        <HStack spacing={3}>
          <Avatar size="sm" name={user?.email} />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="medium">
              {user?.email}
            </Text>
            <Text fontSize="xs" color="gray.500">
              User
            </Text>
          </VStack>
        </HStack>
      </Box>
    </VStack>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Flex>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            w="280px"
            bg={sidebarBg}
            borderRight="1px"
            borderColor={borderColor}
            h="100vh"
            position="fixed"
            left={0}
            top={0}
            zIndex={10}
          >
            <SidebarContent />
          </Box>
        )}

        {/* Main Content */}
        <Box
          flex={1}
          ml={isMobile ? 0 : '280px'}
          minH="100vh"
        >
          {/* Header */}
          <Box
            bg={bgColor}
            borderBottom="1px"
            borderColor={borderColor}
            px={6}
            py={4}
            position="sticky"
            top={0}
            zIndex={5}
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={4}>
                {isMobile && (
                  <IconButton
                    aria-label="Open menu"
                    icon={<HamburgerIcon />}
                    variant="ghost"
                    onClick={onOpen}
                  />
                )}
                
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold">
                    {title}
                  </Text>
                  {breadcrumbs.length > 0 && (
                    <Breadcrumb
                      spacing="8px"
                      separator={<ChevronRightIcon color="gray.500" />}
                      fontSize="sm"
                    >
                      {breadcrumbs.map((item, index) => (
                        <BreadcrumbItem key={index}>
                          <BreadcrumbLink
                            color={item.isActive ? 'blue.500' : 'gray.500'}
                            href={item.isActive ? undefined : item.path}
                          >
                            {item.label}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      ))}
                    </Breadcrumb>
                  )}
                </VStack>
              </HStack>

              <HStack spacing={3}>
                {/* Notifications */}
                <IconButton
                  aria-label="Notifications"
                  icon={<BellIcon />}
                  variant="ghost"
                  size="sm"
                />

                {/* Search */}
                <IconButton
                  aria-label="Search"
                  icon={<SearchIcon />}
                  variant="ghost"
                  size="sm"
                />

                {/* User Menu */}
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="User menu"
                    icon={<SettingsIcon />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<SettingsIcon />}>
                      Profile
                    </MenuItem>
                    <MenuItem icon={<SettingsIcon />}>
                      Settings
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<SettingsIcon />} onClick={handleLogout}>
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </Box>

          {/* Page Content */}
          <Box p={6}>
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};
