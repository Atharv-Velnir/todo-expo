import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { todoApi, Todo } from './services/api';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load todos on component mount
  useEffect(() => {
    loadTodos();
    checkConnection();
  }, []);

  // Check backend connection
  const checkConnection = async () => {
    try {
      const connected = await todoApi.healthCheck();
      setIsConnected(connected);
      if (!connected) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the backend server. Please check your network connection and backend URL.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

  // Load all todos from backend
  const loadTodos = async () => {
    try {
      setLoading(true);
      const fetchedTodos = await todoApi.getAllTodos();
      setTodos(fetchedTodos);
      setIsConnected(true);
    } catch (error: any) {
      console.error('Failed to load todos:', error);
      setIsConnected(false);
      Alert.alert(
        'Error',
        `Failed to load todos: ${error.message}`,
        [{ text: 'Retry', onPress: loadTodos }, { text: 'Cancel' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh todos (pull to refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  };

  // Add new todo
  const addTodo = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter both title and description.');
      return;
    }

    try {
      setLoading(true);
      const newTodo = await todoApi.createTodo(title, description);
      setTodos(prevTodos => [newTodo, ...prevTodos]);
      setTitle('');
      setDescription('');
      Alert.alert('Success', 'Todo added successfully!');
    } catch (error: any) {
      console.error('Failed to add todo:', error);
      Alert.alert('Error', `Failed to add todo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId: string) => {
    try {
      const updatedTodo = await todoApi.toggleTodo(todoId);
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo._id === todoId ? updatedTodo : todo
        )
      );
    } catch (error: any) {
      console.error('Failed to toggle todo:', error);
      Alert.alert('Error', `Failed to update todo: ${error.message}`);
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await todoApi.deleteTodo(todoId);
              setTodos(prevTodos => prevTodos.filter(todo => todo._id !== todoId));
              Alert.alert('Success', 'Todo deleted successfully!');
            } catch (error: any) {
              console.error('Failed to delete todo:', error);
              Alert.alert('Error', `Failed to delete todo: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  // Render individual todo item
  const renderTodoItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => toggleTodo(item._id)}
      >
        <View style={styles.todoTextContainer}>
          <Text style={[
            styles.todoTitle,
            item.completed && styles.completedText
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.todoDescription,
            item.completed && styles.completedText
          ]}>
            {item.description}
          </Text>
          <Text style={styles.todoDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.todoActions}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.completed ? '#4CAF50' : '#FFC107' }
          ]}>
            <Text style={styles.statusText}>
              {item.completed ? '✓' : '○'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(item._id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Todo App</Text>
        <View style={[
          styles.connectionStatus,
          { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.connectionText}>
            {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Add Todo Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter todo title..."
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Enter todo description..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.addButton, loading && styles.disabledButton]}
          onPress={addTodo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.addButtonText}>Add Todo</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Todo List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Todos ({todos.length})
        </Text>
        {loading && todos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading todos...</Text>
          </View>
        ) : (
          <FlatList
            data={todos}
            keyExtractor={(item) => item._id}
            renderItem={renderTodoItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isConnected 
                    ? 'No todos yet. Add your first todo above!' 
                    : 'Unable to load todos. Check your connection.'
                  }
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  connectionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
  },
  todoItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
  },
  todoTextContainer: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  todoDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  todoDate: {
    fontSize: 12,
    color: '#999999',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  todoActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#F44336',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 24,
  },
});

