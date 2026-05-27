import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  status: {
    type: String,
    enum: ["pending", "inprogress", "completed"],
    default: "pending"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  tags: [{ type: String }],
  subtasks: [
    {
      title: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ],
  dueDate: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", taskSchema);
export default Task;
