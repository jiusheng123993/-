const re = /((?:import|export)\s+(?:(?:type\s+)?(?:\{[^}]*\}|[^'"`;]+)\s+from\s+)?['"`])(\.\.?\/[^'"`]+)(['"`])/g;

const lines = [
  "import { AdaptiveSidebar } from './platforms'",
  "import { SidebarPanel } from './sidebar-panel'",
  "import { Sidebar } from './shared/sidebar/Sidebar'",
  "import { useAuth } from './shared/hooks/useAuth'",
  "import './styles.css'",
  "import type { PersonaId } from './ai-partner/personas/personaRegistry'",
];

for (const line of lines) {
  const match = line.match(re);
  console.log(line, '->', match ? match[0] : 'NO MATCH');
}
