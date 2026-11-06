(function (root) {
  "use strict";

  const KEY = "super_ai_tasks_v1";
  const MAX_TASKS = 40;

  function read() {
    try {
      const value = root.localStorage.getItem(KEY);
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed.slice(-MAX_TASKS) : [];
    } catch (_) {
      return [];
    }
  }

  function save(items) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_TASKS)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function add(title, status) {
    const taskTitle = String(title || "").trim().slice(0, 500);
    if (!taskTitle) return {ok:false, error:"empty_title"};

    const allowed = ["planned", "in_progress", "completed", "blocked"];
    const taskStatus = allowed.includes(status) ? status : "planned";
    const tasks = read();

    const task = {
      id: "task_" + Date.now().toString(36) + "_" +
          Math.random().toString(36).slice(2, 8),
      title: taskTitle,
      status: taskStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(task);
    return save(tasks)
      ? {ok:true, task}
      : {ok:false, error:"storage_unavailable", task};
  }

  function list(status) {
    const tasks = read();
    return status ? tasks.filter(t => t.status === status) : tasks;
  }

  function update(id, status) {
    const allowed = ["planned", "in_progress", "completed", "blocked"];
    if (!allowed.includes(status)) return {ok:false, error:"invalid_status"};

    const tasks = read();
    const task = tasks.find(t => t.id === id);
    if (!task) return {ok:false, error:"task_not_found"};

    task.status = status;
    task.updatedAt = new Date().toISOString();

    return save(tasks) ? {ok:true, task} : {ok:false, error:"save_failed"};
  }

  function remove(id) {
    const tasks = read();
    const next = tasks.filter(t => t.id !== id);
    if (next.length === tasks.length) return false;
    return save(next);
  }

  root.SuperAITaskMemory = {version:"1.0.0", add, list, update, remove};

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.SuperAITaskMemory;
  }
})(typeof window !== "undefined" ? window : globalThis);
