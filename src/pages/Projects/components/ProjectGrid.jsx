// src/pages/Projects/components/ProjectGrid.jsx
import {
  Box, VStack, HStack, Text, SimpleGrid, Icon, Badge,
  Center, Spinner, Divider, Button,
} from '@chakra-ui/react';
import { TbRocket, TbUser, TbBuilding } from 'react-icons/tb';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  lead:     { label: 'Lead',     accent: '#FFE500', bg: 'rgba(255,229,0,0.08)',    border: 'rgba(255,229,0,0.25)' },
  proposal: { label: 'Proposal', accent: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.25)' },
  active:   { label: 'Active',   accent: '#39FF14', bg: 'rgba(57,255,20,0.08)',    border: 'rgba(57,255,20,0.25)' },
  complete: { label: 'Complete', accent: '#00E5E5', bg: 'rgba(0,229,229,0.08)',    border: 'rgba(0,229,229,0.25)' },
  archived: { label: 'Archived', accent: '#737373', bg: 'rgba(128,128,128,0.08)',  border: 'rgba(128,128,128,0.25)' },
};

const PIPELINE_STAGES = ['lead', 'proposal', 'active', 'complete'];

const PipelineIndicator = ({ status }) => {
  const activeIndex = PIPELINE_STAGES.indexOf(status);

  return (
    <HStack spacing={1} w="100%">
      {PIPELINE_STAGES.map((stage, idx) => {
        const config = STATUS_CONFIG[stage];
        const isReached = activeIndex >= idx;
        const isCurrent = status === stage;

        return (
          <Box
            key={stage}
            flex={1}
            h="3px"
            borderRadius="full"
            bg={isReached ? config.accent : 'surface.800'}
            opacity={isReached ? (isCurrent ? 1 : 0.4) : 0.15}
            transition="all 0.2s"
            boxShadow={isCurrent ? `0 0 6px ${config.accent}60` : 'none'}
          />
        );
      })}
    </HStack>
  );
};

const ProjectCard = ({ project, onEdit }) => {
  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.lead;
  const isArchived = project.status === 'archived';

  return (
    <Box
      bg="surface.900"
      border="1px solid"
      borderColor="surface.800"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.15s"
      cursor="pointer"
      onClick={() => onEdit(project)}
      opacity={isArchived ? 0.6 : 1}
      _hover={{
        borderColor: config.accent,
        transform: 'translateY(-2px)',
        shadow: `0 8px 24px ${config.accent}12`,
        opacity: 1,
      }}
    >
      {/* Top accent */}
      <Box h="2px" bg={config.accent} opacity={0.7} />

      <Box p={4}>
        {/* Project number + status */}
        <HStack justify="space-between" align="start" mb={2}>
          {project.project_number && (
            <Text
              color="surface.500"
              fontSize="2xs"
              fontFamily="mono"
              fontWeight="700"
              letterSpacing="0.02em"
            >
              {project.project_number}
            </Text>
          )}
          <Badge
            fontSize="2xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.05em"
            px={2}
            py={0.5}
            borderRadius="full"
            bg={config.bg}
            color={config.accent}
            border="1px solid"
            borderColor={config.border}
          >
            {config.label}
          </Badge>
        </HStack>

        {/* Project name */}
        <Text color="white" fontSize="sm" fontWeight="700" noOfLines={2} mb={2} lineHeight="1.4">
          {project.name}
        </Text>

        {/* Client info */}
        {(project.client_name || project.client_company) && (
          <HStack spacing={1.5} mb={3}>
            <Icon as={project.client_company ? TbBuilding : TbUser} boxSize={3} color="surface.600" />
            <Text color="surface.400" fontSize="xs" noOfLines={1}>
              {project.client_name}
              {project.client_company && project.client_name ? ` · ${project.client_company}` : project.client_company || ''}
            </Text>
          </HStack>
        )}

        {/* Notes preview */}
        {project.notes && (
          <Text color="surface.500" fontSize="xs" noOfLines={2} lineHeight="1.5" mb={3}>
            {project.notes}
          </Text>
        )}

        {/* Pipeline indicator */}
        {!isArchived && (
          <Box mb={3}>
            <PipelineIndicator status={project.status} />
          </Box>
        )}

        <Divider borderColor="surface.800" mb={3} />

        {/* Footer */}
        <Text color="surface.600" fontSize="2xs" fontFamily="mono">
          {format(new Date(project.created_at), 'MMM d, yyyy')}
        </Text>
      </Box>
    </Box>
  );
};

const ProjectGrid = ({ projects, loading, onEdit, onAdd, isEmpty }) => {
  if (loading) {
    return (
      <Center py={12}>
        <Spinner size="lg" color="accent.purple" thickness="3px" />
      </Center>
    );
  }

  if (projects.length === 0) {
    return (
      <Box
        bg="surface.900"
        border="1px dashed"
        borderColor="surface.700"
        borderRadius="xl"
        p={8}
        textAlign="center"
      >
        <VStack spacing={2}>
          <Icon as={TbRocket} boxSize={8} color="surface.600" />
          <Text color="surface.400" fontSize="sm">
            {isEmpty ? 'No projects yet' : 'No projects match your search'}
          </Text>
          {isEmpty && (
            <Button
              size="sm"
              variant="outline"
              borderColor="accent.purple"
              color="accent.purple"
              onClick={onAdd}
              mt={2}
            >
              Create your first project
            </Button>
          )}
        </VStack>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onEdit={onEdit} />
      ))}
    </SimpleGrid>
  );
};

export default ProjectGrid;