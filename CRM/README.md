# CRM — Запрошення ✦

**JSON-based CRM for tracking bugs, tasks, and improvements for Zaproshennya platform**

---

## 📁 Structure

```
CRM/
├── data/
│   └── tasks.json      # Main database file
├── README.md          # This file
└── index.html         # Optional: Kanban UI
```

## 🎯 Purpose

- Track all bugs, features, and improvements for the Zaproshennya website
- **No integration** with the main website — used only for AI and human coordination
- AI can query this to understand what needs to be done
- Humans manually update statuses and assign tasks
- Supports drag-and-drop workflow in the UI

---

## 📊 Data Structure

### Columns (Statuses)
| ID | Name | Color | Description |
|----|------|-------|-------------|
| `backlog` | Backlog | #6c757d | Future tasks and ideas |
| `todo` | To Do | #ffc107 | Tasks ready to be worked on |
| `in-progress` | In Progress | #0d6efd | Currently being worked on |
| `review` | Review | #6f42c1 | Completed, awaiting review |
| `done` | Done | #198754 | Completed and verified |
| `rejected` | Rejected | #dc3545 | Won't be implemented |

### Task Structure
```json
{
  "id": "TASK-001",
  "title": "Fix friend request duplicate processing",
  "description": "Users can click accept multiple times...",
  "status": "done",
  "column": "done",
  "priority": "high", // low, medium, high, critical
  "type": "bug",    // bug, feature, improvement, task
  "assignee": "Artem",
  "createdAt": "2026-06-01T16:00:00Z",
  "updatedAt": "2026-06-01T16:05:00Z",
  "labels": ["auth", "friends"],
  "comments": [
    {
      "author": "AI",
      "text": "Implemented idempotent logic in db.js",
      "createdAt": "2026-06-01T16:03:00Z"
    }
  ],
  "relatedFiles": ["js/db.js", "js/pages/friends.js"],
  "gitCommit": "f75f998"
}
```

### User Structure
```json
{
  "id": "artem",
  "name": "Artem",
  "role": "developer",
  "avatar": "👤"
}
```

---

## 🛠️ Workflow

### For AI
1. **Query**: Check `tasks.json` for tasks in `todo` or `in-progress`
2. **Suggest**: Propose solutions or ask for clarification
3. **Report**: After completing work, **tell the human** what was done
4. **Wait**: Human confirms and updates the status

### For Humans
1. **Add Task**: Create new task in appropriate column
2. **Assign**: Set assignee (AI or human)
3. **Move**: Drag task between columns as progress changes
4. **Comment**: Add notes, clarifications, or feedback
5. **Close**: Mark as `done` or `rejected`

### Status Transitions
```
backlog → todo → in-progress → review → done
                    ↓
               rejected (from any status)
```

---

## 📝 AI Interaction Protocol

When AI receives a request:

1. **Check CRM first**: `CRM/data/tasks.json`
2. **If task exists**: Reference its ID and current status
3. **If new request**: Suggest creating a new task

### Example AI Response
```
Task TASK-001 (Fix friend request duplicate) is already DONE ✅
Commit: f75f998
Files: js/db.js, js/pages/friends.js

Suggested: Create TASK-002 for notification system improvements
```

---

## 🎨 Priority Levels

| Level | Color | When to Use |
|-------|-------|-------------|
| `critical` | 🔴 | Site broken, security issues |
| `high` | 🟠 | Major bugs, blocking features |
| `medium` | 🟡 | Normal improvements |
| `low` | 🟢 | Nice-to-have, minor tweaks |

---

## 🏷️ Types
- **bug** — Something is broken
- **feature** — New functionality
- **improvement** — Enhancement to existing feature
- **task** — General work item

---

## 🚀 Quick Start

1. Add a task:
```json
{
  "id": "TASK-001",
  "title": "Your task here",
  "status": "todo",
  "column": "todo",
  "priority": "high",
  "type": "bug"
}
```

2. Open `index.html` in browser to see Kanban board
3. Drag tasks between columns
4. Edit `tasks.json` directly or through UI

---

## 📄 File Format Rules

- Use **UTF-8** encoding
- **2-space** indentation
- **No trailing commas** (JSON spec)
- **ISO 8601** timestamps (`2026-06-01T16:00:00Z`)
- Task IDs: `TASK-{NNN}` format

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-01 | Initial structure |
