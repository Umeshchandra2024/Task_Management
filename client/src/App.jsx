import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiGrid,
  FiList,
  FiActivity,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiEdit3,
  FiCheckCircle,
  FiCalendar,
  FiX,
  FiPlusCircle,
  FiBookmark,
  FiFlag,
  FiCheckSquare,
  FiTrendingUp
} from "react-icons/fi";

const statusLabels = {
  pending: "Pending",
  inprogress: "In Progress",
  completed: "Completed"
};

const statusColors = {
  pending: "pending",
  inprogress: "inprogress",
  completed: "completed"
};

function App() {
  // Tab and Modal states
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, board, list
  const [showModal, setShowModal] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean for list subtask drawer

  // Core Data States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Field States
  const [selectedTask, setSelectedTask] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("medium");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Multi-parameter Filters state
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Drag and drop visual state
  const [dragOverColumn, setDragOverColumn] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/tasks");
      setTasks(response.data);
    } catch (err) {
      setError("Failed to fetch tasks from the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setDueDate(task.dueDate || "");
    setStatus(task.status || "pending");
    setPriority(task.priority || "medium");
    setTags(task.tags || []);
    setTagInput("");
    setSubtasks(task.subtasks || []);
    setNewSubtaskTitle("");
    setError("");
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedTask(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("pending");
    setPriority("medium");
    setTags([]);
    setTagInput("");
    setSubtasks([]);
    setNewSubtaskTitle("");
    setError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Tag helper functions
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  // Subtask helper functions
  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (trimmed) {
      setSubtasks([...subtasks, { title: trimmed, completed: false }]);
      setNewSubtaskTitle("");
    }
  };

  const handleRemoveSubtask = (indexToRemove) => {
    setSubtasks(subtasks.filter((_, idx) => idx !== indexToRemove));
  };

  // Main CRUD actions
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      status,
      priority,
      tags,
      subtasks
    };

    try {
      if (selectedTask) {
        await axios.put(`/api/tasks/${selectedTask._id}`, payload);
      } else {
        await axios.post("/api/tasks", payload);
      }
      await fetchTasks();
      handleCloseModal();
    } catch (err) {
      setError("Unable to save task. Please try again.");
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        await fetchTasks();
      } catch (err) {
        setError("Unable to delete task.");
      }
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus =
      task.status === "pending"
        ? "inprogress"
        : task.status === "inprogress"
        ? "completed"
        : "pending";

    try {
      await axios.put(`/api/tasks/${task._id}`, { status: nextStatus });
      await fetchTasks();
    } catch (err) {
      setError("Unable to update task status.");
    }
  };

  const handleToggleSubtask = async (task, subtaskIndex) => {
    const updatedSubtasks = task.subtasks.map((st, idx) =>
      idx === subtaskIndex ? { ...st, completed: !st.completed } : st
    );

    // Compute next overall status if checklist completion changes
    let nextStatus = task.status;
    const allDone = updatedSubtasks.every(st => st.completed);
    if (allDone && updatedSubtasks.length > 0 && task.status !== "completed") {
      nextStatus = "completed";
    }

    try {
      await axios.put(`/api/tasks/${task._id}`, {
        subtasks: updatedSubtasks,
        status: nextStatus
      });
      // Optimized local update to prevent page flickers
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t._id === task._id
            ? { ...t, subtasks: updatedSubtasks, status: nextStatus }
            : t
        )
      );
    } catch (err) {
      setError("Unable to toggle subtask.");
    }
  };

  const handleToggleExpandTask = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // HTML5 Drag & Drop Engine
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    try {
      await axios.put(`/api/tasks/${taskId}`, { status: targetStatus });
      await fetchTasks();
    } catch (err) {
      setError("Unable to update task stage via drag-and-drop.");
    }
  };

  // Helper date checker
  const isOverdue = (dateStr, status) => {
    if (!dateStr || status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    return due < today;
  };

  // Multi-parameter client filtration logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
      (task.tags && task.tags.some(tg => tg.toLowerCase().includes(search.toLowerCase())));

    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Computed Metrics and Analytics Engine
  const totalTasks = filteredTasks.length;
  const pendingTasks = filteredTasks.filter(t => t.status === "pending").length;
  const inProgressTasks = filteredTasks.filter(t => t.status === "inprogress").length;
  const completedTasks = filteredTasks.filter(t => t.status === "completed").length;

  const highPriorityTasks = filteredTasks.filter(
    t => t.priority === "high" && t.status !== "completed"
  ).length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group Priorities for comparisons
  const lowPriorityCount = filteredTasks.filter(t => t.priority === "low").length;
  const medPriorityCount = filteredTasks.filter(t => t.priority === "medium").length;
  const highPriorityCount = filteredTasks.filter(t => t.priority === "high").length;

  const lowPriorityPct = totalTasks > 0 ? Math.round((lowPriorityCount / totalTasks) * 100) : 0;
  const medPriorityPct = totalTasks > 0 ? Math.round((medPriorityCount / totalTasks) * 100) : 0;
  const highPriorityPct = totalTasks > 0 ? Math.round((highPriorityCount / totalTasks) * 100) : 0;

  // 7-day completed trend calculation
  const getWeeklyTrend = () => {
    const trendData = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dayName = days[targetDate.getDay()];

      // Count tasks completed on this date
      const count = filteredTasks.filter(t => {
        if (t.status !== "completed") return false;
        const taskDate = new Date(t.createdAt);
        return (
          taskDate.getDate() === targetDate.getDate() &&
          taskDate.getMonth() === targetDate.getMonth() &&
          taskDate.getFullYear() === targetDate.getFullYear()
        );
      }).length;

      trendData.push({ day: dayName, count });
    }
    return trendData;
  };

  const trend = getWeeklyTrend();
  // Build a custom SVG line path dynamically based on trend values
  const getSvgPath = () => {
    if (trend.length === 0) return "";
    const width = 600;
    const height = 160;
    const maxVal = Math.max(...trend.map(t => t.count), 4); // default scale divider

    const points = trend.map((t, idx) => {
      const x = (idx / 6) * (width - 60) + 30;
      const y = height - (t.count / maxVal) * (height - 40) - 20;
      return { x, y };
    });

    // Generate beautiful curved bezier path
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = (points[i].x + points[i + 1].x) / 2;
      const cpY1 = points[i].y;
      const cpX2 = (points[i].x + points[i + 1].x) / 2;
      const cpY2 = points[i + 1].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
    }

    // Filled area path
    const areaPath = `${path} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

    return { path, areaPath, points };
  };

  const svgData = getSvgPath();

  return (
    <div className="app-shell">
      {/* ==========================================
         SIDEBAR NAVIGATION
         ========================================== */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-logo">S</div>
          <div className="brand-name">ScholarX</div>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">UC</div>
          <div className="profile-info">
            <h4>Umesh Chandra</h4>
            <p>Lead Developer</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <FiGrid /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === "board" ? "active" : ""}`}
            onClick={() => setActiveTab("board")}
          >
            <FiActivity /> Kanban Board
          </button>
          <button
            className={`nav-item ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <FiList /> Detailed List
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar-add" onClick={handleOpenCreateModal}>
            <FiPlus /> New Task
          </button>
        </div>
      </aside>

      {/* ==========================================
         MAIN SHELL CONTAINER
         ========================================== */}
      <main className="main-container">
        {/* Header Block */}
        <header className="topbar-header">
          <div className="topbar-title">
            <h1>
              {activeTab === "dashboard" && "Analytics Overview"}
              {activeTab === "board" && "Workflows Canvas"}
              {activeTab === "list" && "Task Catalog"}
            </h1>
            <p>
              {activeTab === "dashboard" && "Monitor team velocity, task pipelines, and milestones."}
              {activeTab === "board" && "Drag, drop, and progress tasks across pipelines seamlessly."}
              {activeTab === "list" && "Granular listing with priority flags and subtask checklists."}
            </p>
          </div>
          <div className="topbar-actions">
            <button className="btn-sidebar-add" style={{ padding: "10px 16px" }} onClick={handleOpenCreateModal}>
              <FiPlus /> Add Task
            </button>
          </div>
        </header>

        {/* Global Multi-parameter Search & Filter Row */}
        <section className="filter-panel">
          <div className="search-wrapper">
            <FiSearch />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Stages</option>
            <option value="pending">Pending</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="filter-select"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Quick Clear Filter Option */}
          {(search || filterPriority !== "all" || filterStatus !== "all") && (
            <button
              className="btn-card-icon delete"
              style={{ width: "38px", height: "38px", borderRadius: "10px" }}
              title="Clear Filters"
              onClick={() => {
                setSearch("");
                setFilterPriority("all");
                setFilterStatus("all");
              }}
            >
              <FiX />
            </button>
          )}
        </section>

        {error && (
          <div
            className="error-message"
            style={{
              padding: "16px",
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.25)",
              borderRadius: "12px",
              marginBottom: "24px"
            }}
          >
            {error}
          </div>
        )}

        {/* ==========================================
           TAB CONTENTS
           ========================================== */}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            {/* Stat Cards Grid */}
            <section className="metrics-grid">
              <div className="stat-card primary">
                <div className="stat-info">
                  <p>Total Backlog</p>
                  <h3>{totalTasks}</h3>
                </div>
                <div className="stat-icon-wrapper">
                  <FiBookmark />
                </div>
              </div>

              <div className="stat-card inprogress">
                <div className="stat-info">
                  <p>In Progress</p>
                  <h3>{inProgressTasks}</h3>
                </div>
                <div className="stat-icon-wrapper">
                  <FiActivity />
                </div>
              </div>

              <div className="stat-card completed">
                <div className="stat-info">
                  <p>Completed</p>
                  <h3>{completedTasks}</h3>
                </div>
                <div className="stat-icon-wrapper">
                  <FiCheckCircle />
                </div>
              </div>

              <div className="stat-card urgent">
                <div className="stat-info">
                  <p>Urgent Actions</p>
                  <h3>{highPriorityTasks}</h3>
                </div>
                <div className="stat-icon-wrapper">
                  <FiFlag />
                </div>
              </div>
            </section>

            {/* Visual Charts Section */}
            <section className="dashboard-graphical-layout">
              {/* Hands-on Weekly Trend SVG Area Chart */}
              <div className="graph-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3>Completion Trend (7 Days)</h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FiTrendingUp /> Real-time Sync
                  </div>
                </div>

                <div className="chart-container">
                  {totalTasks === 0 ? (
                    <div style={{ height: "160px", display: "flex", alignItems: "center", justifyItems: "center", color: "#6b7280", width: "100%", justifyContent: "center" }}>
                      No data to chart. Add and complete tasks to view trend!
                    </div>
                  ) : (
                    <svg viewBox="0 0 600 160" width="100%" height="160">
                      <defs>
                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--secondary)" />
                        </linearGradient>
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="30" y1="20" x2="570" y2="20" className="chart-axis-line" />
                      <line x1="30" y1="60" x2="570" y2="60" className="chart-axis-line" />
                      <line x1="30" y1="100" x2="570" y2="100" className="chart-axis-line" />
                      <line x1="30" y1="140" x2="570" y2="140" className="chart-axis-line" />

                      {/* SVG Line and Area */}
                      {svgData.areaPath && <path d={svgData.areaPath} className="chart-area" />}
                      {svgData.path && <path d={svgData.path} className="chart-line" fill="none" />}

                      {/* Nodes */}
                      {svgData.points &&
                        svgData.points.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            className="chart-dot"
                          />
                        ))}

                      {/* X-axis Labels */}
                      {trend.map((t, idx) => {
                        const x = (idx / 6) * (600 - 60) + 30;
                        return (
                          <text
                            key={idx}
                            x={x}
                            y="156"
                            textAnchor="middle"
                            className="chart-label-text"
                          >
                            {t.day}
                          </text>
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>

              {/* Progress Ring Widget */}
              <div className="graph-card">
                <h3>Overall Completion</h3>
                <div className="circular-progress-panel">
                  <div className="circle-progress-wrapper">
                    <svg width="130" height="130" viewBox="0 0 130 130">
                      <defs>
                        <linearGradient id="radial-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary)" />
                          <stop offset="100%" stopColor="var(--secondary)" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="65"
                        cy="65"
                        r="54"
                        strokeWidth="10"
                        fill="transparent"
                        className="circle-progress-bg"
                      />
                      <circle
                        cx="65"
                        cy="65"
                        r="54"
                        strokeWidth="10"
                        fill="transparent"
                        className="circle-progress-bar"
                        strokeDasharray="339.29"
                        strokeDashoffset={339.29 - (339.29 * completionRate) / 100}
                        transform="rotate(-90 65 65)"
                      />
                    </svg>
                    <div className="circle-progress-text">
                      <h4>{completionRate}%</h4>
                      <p>Done</p>
                    </div>
                  </div>

                  <div className="circular-status-legend">
                    <div className="legend-row">
                      <div className="legend-label">
                        <span className="legend-dot pending" /> Pending
                      </div>
                      <span className="legend-value">{pendingTasks}</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-label">
                        <span className="legend-dot inprogress" /> In Progress
                      </div>
                      <span className="legend-value">{inProgressTasks}</span>
                    </div>
                    <div className="legend-row">
                      <div className="legend-label">
                        <span className="legend-dot completed" /> Completed
                      </div>
                      <span className="legend-value">{completedTasks}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Priority Distribution Widget */}
            <section className="graph-card" style={{ marginBottom: "24px" }}>
              <h3>Task Priorities Matrix</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--priority-high)" }}>High Priority</span>
                    <span style={{ color: "#9ca3af" }}>{highPriorityCount} tasks ({highPriorityPct}%)</span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-bar-fill" style={{ width: `${highPriorityPct}%`, background: "var(--priority-high)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--priority-medium)" }}>Medium Priority</span>
                    <span style={{ color: "#9ca3af" }}>{medPriorityCount} tasks ({medPriorityPct}%)</span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-bar-fill" style={{ width: `${medPriorityPct}%`, background: "var(--priority-medium)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--priority-low)" }}>Low Priority</span>
                    <span style={{ color: "#9ca3af" }}>{lowPriorityCount} tasks ({lowPriorityPct}%)</span>
                  </div>
                  <div className="progress-track" style={{ height: "8px" }}>
                    <div className="progress-bar-fill" style={{ width: `${lowPriorityPct}%`, background: "var(--priority-low)" }} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==========================================
           2. KANBAN BOARD VIEW
           ========================================== */}
        {activeTab === "board" && (
          <section className="kanban-grid" style={{ animation: "fadeIn 0.3s ease-out" }}>
            {/* Columns (Pending, In Progress, Completed) */}
            {["pending", "inprogress", "completed"].map(colStatus => {
              const columnTasks = filteredTasks.filter(t => t.status === colStatus);
              return (
                <div
                  key={colStatus}
                  className={`kanban-column ${statusColors[colStatus]} ${
                    dragOverColumn === colStatus ? "drag-over" : ""
                  }`}
                  onDragOver={e => handleDragOver(e, colStatus)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, colStatus)}
                >
                  <div className="kanban-column-header">
                    <div className="column-title-group">
                      <span className="column-indicator" />
                      <h3>{statusLabels[colStatus]}</h3>
                    </div>
                    <span className="column-badge">{columnTasks.length}</span>
                  </div>

                  <div className="kanban-column-cards">
                    {columnTasks.length === 0 ? (
                      <div
                        style={{
                          height: "100px",
                          border: "1.5px dashed rgba(255,255,255,0.03)",
                          borderRadius: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6b7280",
                          fontSize: "0.8rem",
                          textAlign: "center"
                        }}
                      >
                        Drop tasks here
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const doneSub = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
                        const totalSub = task.subtasks ? task.subtasks.length : 0;
                        const subRatio = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;
                        const overdue = isOverdue(task.dueDate, task.status);

                        return (
                          <article
                            key={task._id}
                            className="task-card"
                            draggable
                            onDragStart={e => handleDragStart(e, task._id)}
                          >
                            <div className="task-card-header">
                              <span className={`priority-pill ${task.priority}`}>
                                {task.priority}
                              </span>
                            </div>

                            <h4>{task.title}</h4>
                            {task.description && (
                              <p className="task-card-desc">{task.description}</p>
                            )}

                            {/* Tags list */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="task-card-tags">
                                {task.tags.map((tg, idx) => (
                                  <span key={idx} className="tag-badge">
                                    #{tg}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Subtask micro progress */}
                            {totalSub > 0 && (
                              <div className="subtasks-mini-progress">
                                <div className="subtasks-text-ratio">
                                  <span>Checklist</span>
                                  <span>{doneSub}/{totalSub} ({subRatio}%)</span>
                                </div>
                                <div className="progress-track">
                                  <div
                                    className="progress-bar-fill"
                                    style={{ width: `${subRatio}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="task-card-footer">
                              <span className={`due-date-display ${overdue ? "overdue" : ""}`}>
                                <FiCalendar />
                                {task.dueDate ? (overdue ? `Overdue ${task.dueDate}` : task.dueDate) : "No due date"}
                              </span>

                              <div className="card-action-triggers">
                                <button
                                  className="btn-card-icon complete"
                                  onClick={() => handleToggleStatus(task)}
                                  title={task.status === "completed" ? "Mark Pending" : "Advance Stage"}
                                >
                                  <FiCheckCircle />
                                </button>
                                <button
                                  className="btn-card-icon"
                                  onClick={() => handleOpenEditModal(task)}
                                  title="Edit Task"
                                >
                                  <FiEdit3 />
                                </button>
                                <button
                                  className="btn-card-icon delete"
                                  onClick={() => handleDelete(task._id)}
                                  title="Delete Task"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ==========================================
           3. DETAILED LIST VIEW (WITH EXPANDABLE CHECKLISTS)
           ========================================== */}
        {activeTab === "list" && (
          <section className="list-view-container" style={{ animation: "fadeIn 0.3s ease-out" }}>
            {filteredTasks.length === 0 ? (
              <div className="empty-dashboard-state">
                <div className="empty-state-illustration">
                  <FiList />
                </div>
                <h3>No tasks match search criteria</h3>
                <p>Try refining your search keyword or clearing the filters.</p>
                <button
                  className="btn-sidebar-add"
                  onClick={() => {
                    setSearch("");
                    setFilterPriority("all");
                    setFilterStatus("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredTasks.map(task => {
                const isTaskExpanded = expandedTasks[task._id];
                const totalSubs = task.subtasks ? task.subtasks.length : 0;
                const completedSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
                const overdue = isOverdue(task.dueDate, task.status);

                return (
                  <article key={task._id} className="list-row-item">
                    <div className="list-row-main">
                      {/* Checkbox Trigger */}
                      <button
                        className={`list-row-status-btn ${task.status === "completed" ? "completed" : ""}`}
                        onClick={() => handleToggleStatus(task)}
                        title={task.status === "completed" ? "Reset to Pending" : "Complete Task"}
                      >
                        <FiCheckCircle />
                      </button>

                      {/* Title & Desc */}
                      <div className={`list-row-title-group ${task.status === "completed" ? "completed" : ""}`}>
                        <h4>{task.title}</h4>
                        {task.description && <p className="list-row-desc">{task.description}</p>}
                      </div>

                      {/* Status Label */}
                      <span className={`list-row-status-label ${task.status}`}>
                        {statusLabels[task.status]}
                      </span>

                      {/* Priority Tag */}
                      <span className={`priority-pill ${task.priority}`}>
                        {task.priority}
                      </span>

                      {/* Due Date Indicator */}
                      <span className={`list-row-due ${overdue ? "overdue" : ""}`}>
                        <FiCalendar />
                        {task.dueDate ? (overdue ? `Overdue ${task.dueDate}` : task.dueDate) : "No due date"}
                      </span>

                      {/* Subtask Expanded Badge */}
                      {totalSubs > 0 ? (
                        <button
                          className="list-row-subtask-badge"
                          onClick={() => handleToggleExpandTask(task._id)}
                        >
                          <FiCheckSquare />
                          <span>
                            {completedSubs}/{totalSubs} Check
                          </span>
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          No subtasks
                        </span>
                      )}

                      {/* Actions */}
                      <div className="list-row-actions">
                        <button
                          className="btn-card-icon"
                          onClick={() => handleOpenEditModal(task)}
                          title="Edit Task"
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-card-icon delete"
                          onClick={() => handleDelete(task._id)}
                          title="Delete Task"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    {/* Inline Checklist Expanding Panel */}
                    {isTaskExpanded && totalSubs > 0 && (
                      <div className="list-row-subtasks-expanded">
                        <div className="expanded-header">Subtask Checklist</div>
                        <div className="subtasks-checklist-grid">
                          {task.subtasks.map((st, idx) => (
                            <label key={idx} className="subtask-checklist-item">
                              <input
                                type="checkbox"
                                className="subtask-checkbox"
                                checked={st.completed}
                                onChange={() => handleToggleSubtask(task, idx)}
                              />
                              <span className={`subtask-title ${st.completed ? "completed" : ""}`}>
                                {st.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* Global Empty State (If database is empty) */}
        {totalTasks === 0 && !loading && (
          <div className="empty-dashboard-state" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="empty-state-illustration">
              <FiCheckSquare />
            </div>
            <h3>No Tasks Found</h3>
            <p>Your workflow catalog is currently clean. Create your first epic task to initiate productivity.</p>
            <button className="btn-sidebar-add" onClick={handleOpenCreateModal}>
              <FiPlus /> Get Started
            </button>
          </div>
        )}
      </main>

      {/* ==========================================
         4. HIGH-FIDELITY BACKDROP BLUR FORM DRAWER MODAL
         ========================================== */}
      {showModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-drawer" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{selectedTask ? "Refine Task Settings" : "Configure New Epic"}</h2>
              <button className="btn-modal-close" onClick={handleCloseModal}>
                <FiX />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="modal-body modal-form">
              {/* Task Title */}
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Design wireframes & layouts"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Task Description */}
              <div className="form-group">
                <label>Description Details</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Elaborate on scope of work, deliverables, and guidelines..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Status and Due Date Row */}
              <div className="form-row">
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="inprogress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Custom Priority Card Selectors */}
              <div className="form-group">
                <label>Priority Tier</label>
                <div className="priority-selector-grid">
                  {["low", "medium", "high"].map(tier => (
                    <button
                      key={tier}
                      type="button"
                      className={`priority-select-btn ${tier} ${priority === tier ? "active" : ""}`}
                      onClick={() => setPriority(tier)}
                    >
                      {tier.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comma or Badge Tags Controller */}
              <div className="form-group">
                <label>Category Tags</label>
                <div className="subtasks-builder-input-group" style={{ marginBottom: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter category (e.g. design, sprint1)"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button type="button" className="btn-builder-add" onClick={handleAddTag}>
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="task-card-tags" style={{ margin: 0 }}>
                    {tags.map((tg, idx) => (
                      <span
                        key={idx}
                        className="tag-badge"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                        onClick={() => handleRemoveTag(idx)}
                        title="Remove Tag"
                      >
                        #{tg} <FiX style={{ fontSize: "0.7rem" }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Checklist Builder */}
              <div className="form-group subtasks-builder-section">
                <label style={{ display: "block", marginBottom: "10px" }}>Subtasks Checklist Builder</label>
                {subtasks.length > 0 && (
                  <div className="subtasks-builder-list">
                    {subtasks.map((st, idx) => (
                      <div key={idx} className="builder-item">
                        <span>{st.title}</span>
                        <button
                          type="button"
                          className="btn-builder-remove"
                          onClick={() => handleRemoveSubtask(idx)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="subtasks-builder-input-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Identify subtask step..."
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <button type="button" className="btn-builder-add" onClick={handleAddSubtask}>
                    + Checklist
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-action secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-action primary">
                  {selectedTask ? "Save Settings" : "Deploy Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
