import express, { Request, Response } from 'express';
import Todo, { ITodo } from '../models/Todo';

const router = express.Router();

// GET /api/todos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: todos.length, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching todos' });
  }
});

// POST /api/todos
router.post('/', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description required' });
  }

  try {
    const newTodo = new Todo({ title: title.trim(), description: description.trim(), completed: false });
    const savedTodo = await newTodo.save();
    res.status(201).json({ success: true, message: 'Todo created', data: savedTodo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating todo' });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  try {
    const todo = await Todo.findById(id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    todo.completed = !todo.completed;
    const updated = await todo.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating todo' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  try {
    const deleted = await Todo.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Todo not found' });

    res.status(200).json({ success: true, message: 'Todo deleted', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting todo' });
  }
});

export default router;
