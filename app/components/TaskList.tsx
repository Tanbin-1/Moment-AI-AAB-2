import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAppContext } from "../context/AppContext";
import TaskCard from "./TaskCard";
import { Task } from "../types";

const TaskList = memo(() => {
  const {
    tasks,
    isLoading,
    fetchTasks,
    setModalVisible,
    setEditingTask,
    selectedListId,
  } = useAppContext();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks, selectedListId]);

  const handleTaskPress = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const { isDarkMode } = useAppContext();

  if (isLoading && !refreshing) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDarkMode ? "bg-[#121726]" : "bg-gray-50"}`}
      >
        <ActivityIndicator size="large" color="#3478F6" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-[#121726]" : "bg-gray-50"}`}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={() => handleTaskPress(item)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500 dark:text-gray-400 text-lg">
              No tasks yet. Add one to get started!
            </Text>
          </View>
        }
      />
    </View>
  );
});

export default memo(TaskList);
