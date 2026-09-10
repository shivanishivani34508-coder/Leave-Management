const baseItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "applyLeave", label: "Apply Leave" },
  { id: "leaveHistory", label: "Leave History" },
  { id: "profile", label: "Profile" },
];

const adminItems = [
  { id: "manageLeaves", label: "Manage Leaves" },
  { id: "employees", label: "Employees" },
];

function Sidebar({ currentPage, role, onNavigate }) {
  const items = role === "admin" ? [...baseItems, ...adminItems] : baseItems;

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">LMS</h2>
      <nav>
        {items.map((item) => (
          <button
            key={item.id}
            className={currentPage === item.id ? "active" : ""}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
