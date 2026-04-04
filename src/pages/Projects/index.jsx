// src/pages/Projects/index.jsx
import { useState, useEffect } from 'react';
import { Box, VStack, useDisclosure } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import ProjectsHeader from './components/ProjectsHeader';
import ProjectFilters from './components/ProjectFilters';
import ProjectGrid from './components/ProjectGrid';
import ProjectModal from './components/ProjectModal';

const STATUS_ORDER = ['lead', 'proposal', 'active', 'complete', 'archived'];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingProject, setEditingProject] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*, clients(name, company)')
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, name, company')
          .eq('status', 'active')
          .order('name'),
      ]);

      const enriched = (projectsRes.data || []).map((p) => ({
        ...p,
        client_name: p.clients?.name || null,
        client_company: p.clients?.company || null,
      }));

      setProjects(enriched);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error('Projects fetch error:', err);
      setProjects([]);
      setClients([]);
    }
    setLoading(false);
  };

  const handleAdd = () => { setEditingProject(null); onOpen(); };
  const handleEdit = (project) => { setEditingProject(project); onOpen(); };

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = search
      ? (p.name || '').toLowerCase().includes(q) ||
        (p.project_number || '').toLowerCase().includes(q) ||
        (p.client_name || '').toLowerCase().includes(q) ||
        (p.client_company || '').toLowerCase().includes(q)
      : true;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: projects.length,
    ...STATUS_ORDER.reduce((acc, key) => ({
      ...acc,
      [key]: projects.filter((p) => p.status === key).length,
    }), {}),
  };

  return (
    <Box p={{ base: 4, md: 6 }}>
      <VStack spacing={5} align="stretch">
        <ProjectsHeader counts={counts} onAdd={handleAdd} />
        <ProjectFilters
          search={search}
          onSearch={setSearch}
          filterStatus={filterStatus}
          onFilterStatus={setFilterStatus}
          counts={counts}
        />
        <ProjectGrid
          projects={filtered}
          loading={loading}
          onEdit={handleEdit}
          onAdd={handleAdd}
          isEmpty={projects.length === 0}
        />
      </VStack>

      <ProjectModal
        isOpen={isOpen}
        onClose={onClose}
        project={editingProject}
        clients={clients}
        onSave={fetchData}
      />
    </Box>
  );
};

export default Projects;