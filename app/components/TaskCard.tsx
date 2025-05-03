import React, { memo } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Check, Trash2, Edit } from "lucide-react-native";
import { Task } from "../types";
import { useAppContext } from "../context/AppContext";

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

const TaskCard = memo(({ task, onPress }: TaskCardProps) => {
  const { toggleTaskCompletion, deleteTask, isDarkMode } = useAppContext();

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [64, 0],
    });

    return (
      <View className="flex-row">
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <TouchableOpacity
            className="bg-red-500 w-16 h-full justify-center items-center"
            onPress={() => deleteTask(task.id)}
          >
            <Trash2 size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-64, 0],
    });

    return (
      <Animated.View style={{ transform: [{ translateX: trans }] }}>
        <TouchableOpacity
          className="bg-green-500 w-16 h-full justify-center items-center"
          onPress={() => toggleTaskCompletion(task.id, !task.completed)}
        >
          <Check size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    // Format as MM-DD-YYYY
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    // Format time in 12-hour format with AM/PM
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hours12}:${minutes} ${ampm}`;
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      <TouchableOpacity
        onPress={onPress}
        className={`p-4 mb-2 rounded-xl shadow-sm border-l-4 ${isDarkMode ? "bg-[#1E2338]" : "bg-white"} ${task.completed ? "border-green-500" : "border-blue-500"}`}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${task.completed ? "bg-green-500 border-green-500" : "border-blue-500"}`}
            onPress={() => toggleTaskCompletion(task.id, !task.completed)}
          >
            {task.completed && <Check size={14} color="white" />}
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row justify-between">
              <Text
                className={`font-medium text-base ${isDarkMode ? "text-white" : "text-gray-800"} ${task.completed ? "line-through text-gray-500" : ""}`}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <View className="flex-row">
                <TouchableOpacity onPress={onPress} className="ml-2">
                  <Edit size={16} color="#3478F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteTask(task.id)}
                  className="ml-2"
                >
                  <Trash2 size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>

            {task.description ? (
              <Text
                className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} ${task.completed ? "line-through" : ""}`}
                numberOfLines={1}
              >
                {task.description}
              </Text>
            ) : null}

            {task.due_date ? (
              <Text
                className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Due: {formatDate(task.due_date)}
              </Text>
            ) : null}

            {task.reminder_time ? (
              <Text
                className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Reminder: {formatDate(task.reminder_time)} at{" "}
                {formatTime(task.reminder_time)}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

export default memo(TaskCard);
