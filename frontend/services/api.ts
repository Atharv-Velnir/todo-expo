import axios, { AxiosResponse } from 'axios';
import Constants from 'expo-constants';

// Get backend URL from app config
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Todo interface
export interface Todo {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// API response interface
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

// API service class
class TodoApiService {
  // Fetch all todos
  async getAllTodos(): Promise<Todo[]> {
    try {
      const response: AxiosResponse<ApiResponse<Todo[]>> = await api.get('/todos');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch todos');
      }
    } catch (error: any) {
      console.error('Error fetching todos:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Network error while fetching todos'
      );
    }
  }

  // Create new todo
  async createTodo(title: string, description: string): Promise<Todo> {
    try {
      if (!title.trim() || !description.trim()) {
        throw new Error('Title and description are required');
      }

      const response: AxiosResponse<ApiResponse<Todo>> = await api.post('/todos', {
        title: title.trim(),
        description: description.trim(),
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create todo');
      }
    } catch (error: any) {
      console.error('Error creating todo:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Network error while creating todo'
      );
    }
  }

  // Toggle todo completion status
  async toggleTodo(todoId: string): Promise<Todo> {
    try {
      if (!todoId) {
        throw new Error('Todo ID is required');
      }

      const response: AxiosResponse<ApiResponse<Todo>> = await api.put(`/todos/${todoId}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update todo');
      }
    } catch (error: any) {
      console.error('Error toggling todo:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Network error while updating todo'
      );
    }
  }

  // Delete todo
  async deleteTodo(todoId: string): Promise<void> {
    try {
      if (!todoId) {
        throw new Error('Todo ID is required');
      }

      const response: AxiosResponse<ApiResponse<Todo>> = await api.delete(`/todos/${todoId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete todo');
      }
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Network error while deleting todo'
      );
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.data.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const todoApi = new TodoApiService();
export default todoApi;

