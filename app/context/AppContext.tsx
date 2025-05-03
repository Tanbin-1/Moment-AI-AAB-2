import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { getSupabase } from "../lib/supabase";
import { List, Task, NewTask, UpdateTask, NewList } from "../types";
import * as Notifications from "expo-notifications";
import { Platform, AppState } from "react-native";
import { checkFirstInstall } from "../lib/storage";
import { cleanupDuplicateLists } from "../lib/cleanupDuplicates";

type AppContextType = {
  lists: List[];
  tasks: Task[];
  selectedListId: string | null;
  isLoading: boolean;
  isModalVisible: boolean;
  editingTask: Task | null;
  isDarkMode: boolean;
  fetchLists: () => Promise<void>;
  fetchTasks: (listId?: string) => Promise<void>;
  addTask: (task: NewTask) => Promise<void>;
  updateTask: (id: string, updates: UpdateTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  updateList: (id: string, updates: UpdateList) => Promise<void>;
  toggleTaskCompletion: (id: string, completed: boolean) => Promise<void>;
  addList: (list: NewList) => Promise<void>;
  selectList: (listId: string | null) => void;
  setModalVisible: (visible: boolean) => void;
  setEditingTask: (task: Task | null) => void;
  toggleDarkMode: () => void;
  scheduleNotification: (task: Task) => Promise<string | null>;
  cancelNotification: (notificationId: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Set up notification channels in a non-blocking way
if (Platform.OS === "android") {
  // Use setTimeout to make this non-blocking
  setTimeout(() => {
    try {
      console.log("Setting up Android notification channels...");
      // Set the app name for notifications
      Notifications.setNotificationChannelAsync("default", {
        name: "Moment AI",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3478F6",
        sound: true,
        enableVibrate: true,
        showBadge: true,
      }).then(() => console.log("Default notification channel created"));

      // Create a second channel for reminders with a different sound
      Notifications.setNotificationChannelAsync("reminders", {
        name: "Moment AI Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3478F6",
        sound: true,
        enableVibrate: true,
        showBadge: true,
      }).then(() => console.log("Reminders notification channel created"));

      console.log("Notification channels setup initiated");
    } catch (error) {
      console.error("Error setting up notification channel:", error);
      // Continue app initialization even if notification setup fails
    }
  }, 1000); // Delay by 1 second to not block app startup
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [isFirstInstall, setIsFirstInstall] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    if (Platform.OS !== "web") {
      try {
        console.log("Starting notification permission request process...");
        console.log("Checking notification permissions");
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        console.log("Existing permission status:", existingStatus);

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          console.log("Requesting notification permissions");

          // Request permissions with app name "Moment AI"
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: true,
            },
          });
          finalStatus = status;
          console.log("New permission status:", finalStatus);
        }

        if (finalStatus === "granted") {
          setNotificationPermission(true);
          console.log("Notification permissions granted");

          // Set up notification handler with proper configuration
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });

          // Register for push notifications if needed
          if (Platform.OS === "android") {
            try {
              await Notifications.getDevicePushTokenAsync();
              console.log("Push token obtained");
            } catch (tokenError) {
              console.log("Failed to get push token:", tokenError);
            }
          }
        } else {
          console.log("Notification permissions denied");
        }

        return finalStatus === "granted";
      } catch (error) {
        console.error("Error requesting notification permissions:", error);
        return false;
      }
    }
    return false;
  };

  // Schedule a notification for a task
  const scheduleNotification = useCallback(
    async (task: Task): Promise<string | null> => {
      console.log("Scheduling notification for task:", task.title);
      if (!task.reminder_time || Platform.OS === "web") return null;

      try {
        // Add timeout to permission request
        const permissionPromise = requestNotificationPermissions();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log("Permission request timeout, assuming not granted");
            resolve(false);
          }, 3000);
        });

        const hasPermission = await Promise.race([
          permissionPromise,
          timeoutPromise,
        ]);
        if (!hasPermission) {
          console.log("Notification permission not granted or timed out");
          return null;
        }

        try {
          const reminderDate = new Date(task.reminder_time);
          console.log(
            "Scheduling notification for:",
            reminderDate.toLocaleString(),
          );

          // Only schedule if the reminder time is in the future
          if (reminderDate > new Date()) {
            // Cancel any existing notifications for this task
            try {
              // In a real app, you would store notification IDs per task
              // For now, we'll cancel notifications for this task ID if they exist
              await Notifications.cancelScheduledNotificationAsync(
                `task-${task.id}`,
              );
              console.log(`Canceled existing notification for task ${task.id}`);
            } catch (e) {
              // This is expected if no notification exists yet
              console.log("No existing notification found to cancel");
            }

            // Format the task title and description for the notification
            const taskTitle = task.title || "Task Reminder";
            const taskDescription = task.description || "You have a task due";

            const notificationContent = {
              title: "Moment AI", // Changed to match app name
              body: taskTitle,
              subtitle: taskDescription,
              data: { taskId: task.id, taskTitle, taskDescription },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              color: "#3478F6",
              badge: 1,
              channelId: "reminders",
            };

            console.log("Notification content:", notificationContent);

            // Use the task ID as part of the notification identifier
            const notificationId =
              await Notifications.scheduleNotificationAsync({
                identifier: `task-${task.id}`,
                content: notificationContent,
                trigger: reminderDate,
              });

            console.log("Scheduled notification with ID:", notificationId);
            return notificationId;
          } else {
            console.log(
              "Reminder time is in the past, not scheduling notification",
            );
          }
          return null;
        } catch (error) {
          console.error("Error scheduling notification:", error);
          return null;
        }
      } catch (error) {
        console.error("Error in scheduleNotification:", error);
        return null;
      }
    },
    [requestNotificationPermissions],
  );

  // Cancel a notification
  const cancelNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      if (Platform.OS !== "web") {
        try {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
          console.error("Error canceling notification:", error);
        }
      }
    },
    [],
  );

  const fetchLists = useCallback(async () => {
    try {
      console.log("Fetching lists from Supabase...");

      // Add timeout to Supabase query
      const fetchPromise = getSupabase()
        .from("lists")
        .select("*")
        .order("created_at");

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Supabase fetch timeout")), 5000);
      });

      const { data, error } = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as any;

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} lists`);
      setLists(data || []);

      // Set the first list as selected if none is selected
      if (!selectedListId && data && data.length > 0) {
        setSelectedListId(data[0].id);
      }

      // Always ensure loading is set to false after fetch
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching lists:", error);
      // Return empty lists on error to prevent app from crashing
      setLists([]);
      setIsLoading(false);
    }
  }, [selectedListId]);

  const fetchTasks = useCallback(
    async (listId?: string) => {
      setIsLoading(true);
      try {
        const targetListId = listId || selectedListId;
        console.log(`Fetching tasks for list ID: ${targetListId || "all"}`);

        let query = getSupabase()
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (targetListId) {
          query = query.eq("list_id", targetListId);
        }

        // Add timeout to prevent hanging
        const fetchPromise = query;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Tasks fetch timeout")), 5000);
        });

        const { data, error } = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as any;

        if (error) throw error;
        console.log(`Fetched ${data?.length || 0} tasks`);
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // Return empty tasks on error
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedListId],
  );

  const addTask = useCallback(
    async (task: NewTask) => {
      try {
        console.log("Adding task:", task);

        // Validate task data
        if (!task.title || task.title.trim() === "") {
          throw new Error("Task title is required");
        }

        if (!task.list_id) {
          // Try to get the first list if available
          const { data: listsData } = await getSupabase()
            .from("lists")
            .select("id")
            .limit(1);
          if (listsData && listsData.length > 0) {
            task.list_id = listsData[0].id;
          } else {
            console.error(
              "No list_id provided for task and no lists available",
            );
            throw new Error("No list_id provided for task");
          }
        }

        // Prepare task data with timestamps
        const taskWithTimestamps = {
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed: task.completed !== undefined ? task.completed : false,
        };

        console.log("Inserting task with data:", taskWithTimestamps);

        // Insert the task
        const { data, error } = await getSupabase()
          .from("tasks")
          .insert(taskWithTimestamps)
          .select();

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Task added successfully:", data);

        // Schedule notification if reminder is set
        if (data && data.length > 0 && data[0].reminder_time) {
          await scheduleNotification(data[0]);
        }

        await fetchTasks();
        return data;
      } catch (error) {
        console.error("Error adding task:", error);
        throw error;
      }
    },
    [fetchTasks, scheduleNotification],
  );

  const updateTask = useCallback(
    async (id: string, updates: UpdateTask) => {
      try {
        // Get the current task to check if we need to update notifications
        const { data: currentTask } = await getSupabase()
          .from("tasks")
          .select("*")
          .eq("id", id)
          .single();

        const { data, error } = await getSupabase()
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .select();

        if (error) throw error;

        // Handle notification updates if reminder time changed
        if (data && data.length > 0) {
          const updatedTask = data[0];

          // Schedule new notification if reminder is set or changed
          if (updatedTask.reminder_time) {
            await scheduleNotification(updatedTask);
          }
        }

        await fetchTasks();
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },
    [fetchTasks, scheduleNotification],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        // Get the task before deleting to check if it has a reminder
        const { data: taskToDelete } = await getSupabase()
          .from("tasks")
          .select("*")
          .eq("id", id)
          .single();

        const { error } = await getSupabase().from("tasks").delete().eq("id", id);

        if (error) throw error;

        // Cancel any scheduled notifications for this task
        if (taskToDelete && taskToDelete.reminder_time) {
          // Note: In a real app, you would store notification IDs in the database
          // For this example, we'll try to cancel based on task ID
          try {
            await Notifications.cancelAllScheduledNotificationsAsync();
          } catch (notifError) {
            console.error("Error canceling notifications:", notifError);
          }
        }

        await fetchTasks();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    },
    [fetchTasks],
  );

  const updateList = useCallback(
    async (id: string, updates: UpdateList) => {
      try {
        const { error } = await getSupabase()
          .from("lists")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
        await fetchLists();
      } catch (error) {
        console.error("Error updating list:", error);
      }
    },
    [fetchLists],
  );

  const deleteList = useCallback(
    async (id: string) => {
      try {
        // First delete all tasks associated with this list
        const { error: tasksError } = await getSupabase()
          .from("tasks")
          .delete()
          .eq("list_id", id);

        if (tasksError) throw tasksError;

        // Then delete the list itself
        const { error } = await getSupabase().from("lists").delete().eq("id", id);

        if (error) throw error;

        // If the deleted list was selected, select another list
        if (selectedListId === id) {
          // Find another list to select
          const remainingLists = lists.filter((list) => list.id !== id);
          if (remainingLists.length > 0) {
            setSelectedListId(remainingLists[0].id);
          } else {
            setSelectedListId(null);
          }
        }

        await fetchLists();
        await fetchTasks();
      } catch (error) {
        console.error("Error deleting list:", error);
      }
    },
    [fetchLists, fetchTasks, lists, selectedListId],
  );

  const toggleTaskCompletion = useCallback(
    async (id: string, completed: boolean) => {
      await updateTask(id, { completed });
    },
    [updateTask],
  );

  const addList = useCallback(
    async (list: NewList) => {
      try {
        const { data, error } = await getSupabase()
          .from("lists")
          .insert(list)
          .select();

        if (error) throw error;
        await fetchLists();

        // Select the newly created list
        if (data && data.length > 0) {
          setSelectedListId(data[0].id);
        }
      } catch (error) {
        console.error("Error adding list:", error);
      }
    },
    [fetchLists],
  );

  const selectList = useCallback((listId: string | null) => {
    setSelectedListId(listId);
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    // Only set up subscriptions if this is not the first install
    if (!isFirstInstall) {
      const tasksSubscription = getSupabase()
        .channel("tasks-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          () => {
            fetchTasks();
          },
        )
        .subscribe();

      const listsSubscription = getSupabase()
        .channel("lists-channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lists" },
          () => {
            fetchLists();
          },
        )
        .subscribe();

      return () => {
        getSupabase().removeChannel(tasksSubscription);
        getSupabase().removeChannel(listsSubscription);
      };
    }
  }, [selectedListId, isFirstInstall, fetchTasks, fetchLists]);

  // Check if this is the first install
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const checkInstallStatus = async () => {
      try {
        console.log("Checking install status...");

        // Set a timeout to prevent infinite loading
        initTimeout = setTimeout(() => {
          if (isMounted) {
            console.log(
              "Initialization timeout reached, forcing app to continue",
            );
            setIsLoading(false);
          }
        }, 5000); // 5 second timeout

        // First, check if we need to clean up duplicate lists
        try {
          // Check for existing lists before deciding to create a default list
          const { data: existingLists, error: listError } = (await Promise.race(
            [
              getSupabase().from("lists").select("*"),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Lists check timeout")),
                  3000,
                ),
              ),
            ],
          )) as any;

          if (!listError && existingLists && existingLists.length > 0) {
            console.log(
              `Found ${existingLists.length} existing lists, not creating default list`,
            );
            // We already have lists, so this is not a first install
            setIsFirstInstall(false);
            setLists(existingLists);

            // Set the first list as selected
            if (!selectedListId && existingLists.length > 0) {
              setSelectedListId(existingLists[0].id);
            }

            // Fetch tasks for the selected list
            if (selectedListId) {
              fetchTasks(selectedListId).catch((err) =>
                console.log("Error fetching tasks for selected list:", err),
              );
            }

            setIsLoading(false);
            return;
          }
        } catch (checkError) {
          console.log(
            "Error checking existing lists, continuing with normal flow:",
            checkError,
          );
        }

        const isFirst = await checkFirstInstall();
        if (!isMounted) return;

        setIsFirstInstall(isFirst);
        console.log("Is first install:", isFirst);

        // Only fetch data if this is not the first install
        if (!isFirst) {
          console.log("Not first install, fetching data...");
          try {
            await Promise.race([
              fetchLists(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Fetch timeout")), 3000),
              ),
            ]);
          } catch (fetchError) {
            console.log(
              "Fetch operation timed out or failed, continuing anyway",
            );
          }
        } else {
          console.log("First install, starting with empty data");
          // For first install, set loading to false without fetching data
          setIsLoading(false);
          // Create a default list for first-time users
          try {
            // Double-check that we don't already have lists before creating a default one
            const { data: checkLists, error: checkError } = await getSupabase()
              .from("lists")
              .select("count");

            if (!checkError && (!checkLists || checkLists.length === 0)) {
              await addList({
                name: "My Tasks",
                color: "#3478F6",
              });
            } else {
              console.log("Lists already exist, not creating default list");
            }
          } catch (listError) {
            console.error("Error creating default list:", listError);
          }
        }
      } catch (error) {
        console.error("Error during app initialization:", error);
      } finally {
        // Always ensure loading state is reset
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(initTimeout);
        }
      }
    };

    // First try to clean up any duplicate lists that might exist
    cleanupDuplicateLists()
      .catch((err) =>
        console.log("Non-critical error cleaning up duplicates:", err),
      )
      .finally(() => {
        // Then proceed with normal initialization
        checkInstallStatus();
      });

    // Request notification permissions on app start - make non-blocking
    if (Platform.OS !== "web") {
      setTimeout(() => {
        requestNotificationPermissions().catch((err) =>
          console.log("Non-critical error requesting notifications:", err),
        );
      }, 2000); // Delay notification permission request
    }

    // Set up AppState listener to detect when app comes to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        // App has come to the foreground
        console.log("App has come to the foreground!");
        if (!isFirstInstall) {
          fetchLists().catch((err) =>
            console.log("Error fetching lists on resume:", err),
          );
          fetchTasks().catch((err) =>
            console.log("Error fetching tasks on resume:", err),
          );
        }
      }
      setAppState(nextAppState);
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.remove();
    };
  }, [refreshKey, fetchLists, addList]);

  // Fetch tasks when selected list changes
  useEffect(() => {
    if (selectedListId && !isFirstInstall) {
      console.log(
        "Selected list changed, fetching tasks for list:",
        selectedListId,
      );
      fetchTasks();
    }
  }, [selectedListId, isFirstInstall, fetchTasks]);

  return (
    <AppContext.Provider
      value={{
        lists,
        tasks,
        selectedListId,
        isLoading,
        isModalVisible,
        editingTask,
        isDarkMode,
        fetchLists,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        deleteList,
        updateList,
        toggleTaskCompletion,
        addList,
        selectList,
        setModalVisible,
        setEditingTask,
        toggleDarkMode,
        scheduleNotification,
        cancelNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
