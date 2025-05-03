import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import DateTimePickerWeb from "./DateTimePickerWeb";
import DateTimePickerAndroid from "./DateTimePickerAndroid";

// Only import DateTimePicker on iOS
const DateTimePicker =
  Platform.OS === "ios"
    ? require("@react-native-community/datetimepicker").default
    : null;
import { X, Calendar, Bell, Check } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";
import ListSelector from "./ListSelector";

const TaskModal = () => {
  const {
    isModalVisible,
    setModalVisible,
    addTask,
    updateTask,
    editingTask,
    setEditingTask,
    selectedListId,
    lists,
  } = useAppContext();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showDueDateBox, setShowDueDateBox] = useState(false);
  const [showReminderBox, setShowReminderBox] = useState(false);
  const [listId, setListId] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setDueDate(editingTask.due_date ? new Date(editingTask.due_date) : null);
      setReminderTime(
        editingTask.reminder_time ? new Date(editingTask.reminder_time) : null,
      );
      setListId(editingTask.list_id);
    } else {
      resetForm();
      // Make sure we have a valid list ID
      if (selectedListId) {
        setListId(selectedListId);
      } else if (lists && lists.length > 0) {
        // If no list is selected, try to get the first available list
        setListId(lists[0].id);
      }
    }
  }, [editingTask, selectedListId, lists]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(null);
    setReminderTime(null);
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingTask(null);
    resetForm();
    setShowDueDateBox(false);
    setShowReminderBox(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    // Get the current list ID or use the first available list
    let taskListId = listId;

    if (!taskListId) {
      if (lists && lists.length > 0) {
        taskListId = lists[0].id;
        setListId(taskListId);
      } else {
        alert("Please select or create a list first");
        return;
      }
    }

    const taskData = {
      title: title.trim(),
      description: description?.trim() || null,
      due_date: dueDate?.toISOString() || null,
      reminder_time: reminderTime?.toISOString() || null,
      list_id: taskListId,
      completed: false,
    };

    console.log("Saving task with data:", taskData);

    try {
      // Close the modal immediately to improve perceived performance
      handleClose();

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        console.log("Task updated successfully");
      } else {
        const result = await addTask(taskData);
        console.log("Task added successfully with result:", result);
      }
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to save task. Please try again.");
    }
  };

  const formatDate = (date: Date) => {
    // Format as MM-DD-YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const formatTime = (date: Date) => {
    // Format time in 12-hour format with AM/PM
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hours12}:${minutes} ${ampm}`;
  };

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-end">
          <Pressable className="flex-1 bg-black/30" onPress={handleClose} />
          <View className="bg-white dark:bg-gray-800 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold dark:text-white">
                {editingTask ? "Edit Task" : "New Task"}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-96">
              <TextInput
                className="bg-gray-100 dark:bg-gray-700 dark:text-white p-4 rounded-xl mb-4"
                placeholder="Task title"
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                className="bg-gray-100 dark:bg-gray-700 dark:text-white p-4 rounded-xl mb-4 min-h-[100px]"
                placeholder="Description (optional)"
                placeholderTextColor="#888"
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />

              <View className="mb-4">
                <Text className="text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  List
                </Text>
                <ListSelector
                  selectedListId={listId}
                  onSelectList={setListId}
                  compact
                />
              </View>

              <TouchableOpacity
                className="flex-row items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-2"
                onPress={() => {
                  setShowDueDateBox(!showDueDateBox);
                  setShowReminderBox(false);
                  setShowDueDatePicker(false);
                  setShowReminderPicker(false);
                }}
              >
                <Calendar size={20} color="#3478F6" />
                <Text className="ml-2 dark:text-white">
                  {dueDate ? `Due: ${formatDate(dueDate)}` : "Add Due Date"}
                </Text>
              </TouchableOpacity>
              
              {/* Select Date box */}
              {showDueDateBox && !dueDate && (
                <TouchableOpacity
                  className="flex-row items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 ml-6 mr-6 border border-gray-200 dark:border-gray-600"
                  onPress={() => setShowDueDatePicker(true)}
                >
                  <Text className="text-center w-full text-gray-700 dark:text-gray-300">
                    Select Date
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-row items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-2"
                onPress={() => {
                  setShowReminderBox(!showReminderBox);
                  setShowDueDateBox(false);
                  setShowDueDatePicker(false);
                  setShowReminderPicker(false);
                }}
              >
                <Bell size={20} color="#3478F6" />
                <Text className="ml-2 dark:text-white">
                  {reminderTime
                    ? `Reminder: ${formatDate(reminderTime)} at ${formatTime(reminderTime)}`
                    : "Add Reminder"}
                </Text>
              </TouchableOpacity>
              
              {/* Select Date and Time box */}
              {showReminderBox && !reminderTime && (
                <TouchableOpacity
                  className="flex-row items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4 ml-6 mr-6 border border-gray-200 dark:border-gray-600"
                  onPress={() => setShowReminderPicker(true)}
                >
                  <Text className="text-center w-full text-gray-700 dark:text-gray-300">
                    Select Date and Time
                  </Text>
                </TouchableOpacity>
              )}

              {showDueDatePicker &&
                (Platform.OS === "web" ? (
                  <DateTimePickerWeb
                    value={dueDate || new Date()}
                    mode="date"
                    onChange={(event: any, selectedDate: Date | undefined) => {
                      if (selectedDate) {
                        setDueDate(selectedDate);
                        setShowDueDateBox(false);
                      }
                    }}
                    onClose={() => {
                      setShowDueDatePicker(false);
                      setShowDueDateBox(false);
                    }}
                  />
                ) : Platform.OS === "android" ? (
                  <DateTimePickerAndroid
                    value={dueDate || new Date()}
                    mode="date"
                    onChange={(event: any, selectedDate: Date | undefined) => {
                      if (selectedDate) {
                        setDueDate(selectedDate);
                        setShowDueDateBox(false);
                      }
                    }}
                    onClose={() => {
                      setShowDueDatePicker(false);
                      setShowDueDateBox(false);
                    }}
                  />
                ) : Platform.OS === "ios" ? (
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event: any, selectedDate: Date | undefined) => {
                      setShowDueDatePicker(false);
                      setShowDueDateBox(false);
                      if (selectedDate) setDueDate(selectedDate);
                    }}
                  />
                ) : null)}

              {showReminderPicker &&
                (Platform.OS === "web" ? (
                  <DateTimePickerWeb
                    value={reminderTime || new Date()}
                    mode="datetime"
                    onChange={(event: any, selectedDate: Date | undefined) => {
                      if (selectedDate) {
                        setReminderTime(selectedDate);
                        setShowReminderBox(false);
                      }
                    }}
                    onClose={() => {
                      setShowReminderPicker(false);
                      setShowReminderBox(false);
                    }}
                  />
                ) : Platform.OS === "android" ? (
                  <DateTimePickerAndroid
                    value={reminderTime || new Date()}
                    mode="datetime"
                    onChange={(event: any, selectedDate: Date | undefined) => {
                      if (selectedDate) {
                        setReminderTime(selectedDate);
                        setShowReminderBox(false);
                      }
                    }}
                    onClose={() => {
                      setShowReminderPicker(false);
                      setShowReminderBox(false);
                    }}
                  />
                ) : Platform.OS === "ios" ? (
                  <DateTimePicker
                    value={reminderTime || new Date()}
                    mode="datetime"
                    display="default"
                    onChange={(event: any, selectedDate: Date | undefined) => {
                      setShowReminderPicker(false);
                      setShowReminderBox(false);
                      if (selectedDate) setReminderTime(selectedDate);
                    }}
                  />
                ) : null)}
            </ScrollView>

            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-xl mt-4 items-center"
              onPress={handleSave}
            >
              <Text className="text-white font-semibold">
                {editingTask ? "Update Task" : "Add Task"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default TaskModal;
