export interface CmdItem {
  label: string;
  icon: string;
  tab?: string;
  action?: string;
}

export interface CmdGroup {
  group: string;
  items: CmdItem[];
}

export const _CMD_ITEMS: Record<string, CmdGroup[]> = {
  employee: [
    {
      group: "Navigation",
      items: [
        { label: "My Tasks", icon: "🛠", tab: "My Tasks" },
        { label: "Productivity", icon: "⏱", tab: "Productivity" },
        { label: "Milestones", icon: "🎯", tab: "Milestones" },
        { label: "RFIs", icon: "⊕", tab: "RFIs" },
      ],
    },
    {
      group: "Actions",
      items: [
        { label: "Schedule Meeting", icon: "📅", action: "meeting" },
        { label: "Raise Issue", icon: "⚠", action: "issue" },
      ],
    },
  ],
  teamlead: [
    {
      group: "Navigation",
      items: [
        { label: "Overview", icon: "◈", tab: "Overview" },
        { label: "My Team", icon: "👥", tab: "My Team" },
        { label: "Issues", icon: "⚠", tab: "Issues" },
        { label: "RFIs", icon: "⊕", tab: "RFIs" },
        { label: "Requests", icon: "📩", tab: "Requests" },
        { label: "Tasks", icon: "🛠", tab: "Tasks" },
      ],
    },
    {
      group: "Actions",
      items: [
        { label: "Schedule Meeting", icon: "📅", action: "meeting" },
        { label: "Raise Issue", icon: "⚠", action: "issue" },
      ],
    },
  ],
  admin: [
    {
      group: "Navigation",
      items: [
        { label: "All Projects", icon: "🏗", tab: "All Projects" },
        { label: "Team Management", icon: "👥", tab: "Team Management" },
        { label: "Client Management", icon: "🤝", tab: "Client Management" },
        { label: "Reports", icon: "📈", tab: "Reports" },
        { label: "Management", icon: "⚙", tab: "Management" },
      ],
    },
    {
      group: "Actions",
      items: [
        { label: "Schedule Meeting", icon: "📅", action: "meeting" },
        { label: "Add Person", icon: "👤", action: "people" },
      ],
    },
  ],
  client: [
    {
      group: "Navigation",
      items: [
        { label: "Project Status", icon: "◈", tab: "Project Status" },
        { label: "Milestones & Approvals", icon: "🎯", tab: "Milestones & Approvals" },
        { label: "Documents", icon: "📄", tab: "Documents" },
        { label: "RFIs", icon: "⊕", tab: "RFIs" },
        { label: "Work Items", icon: "🗂", tab: "Work Items" },
      ],
    },
  ],
};
