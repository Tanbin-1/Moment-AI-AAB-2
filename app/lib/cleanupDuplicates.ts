import { getSupabase } from "./supabase";
import { List } from "../types";

/**
 * Cleanup duplicate default lists
 * This is useful when multiple default lists have been created
 */
export const cleanupDuplicateLists = async (): Promise<void> => {
  try {
    console.log("Checking for duplicate default lists...");

    // Find all lists with the default name
    const { data: defaultLists, error } = await getSupabase()
      .from("lists")
      .select("*")
      .eq("name", "My Tasks");

    if (error) {
      console.error("Error fetching default lists:", error);
      return;
    }

    if (defaultLists && defaultLists.length > 1) {
      console.log(
        `Found ${defaultLists.length} duplicate default lists, keeping only the first one`,
      );

      // Sort by created_at to keep the oldest one
      defaultLists.sort((a: List, b: List) => {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      // Keep the first one, delete the rest
      const listsToDelete = defaultLists.slice(1);

      for (const list of listsToDelete) {
        // First move all tasks to the first list
        const { error: moveError } = await getSupabase()
          .from("tasks")
          .update({ list_id: defaultLists[0].id })
          .eq("list_id", list.id);

        if (moveError) {
          console.error(`Error moving tasks from list ${list.id}:`, moveError);
          continue;
        }

        // Then delete the duplicate list
        const { error: deleteError } = await getSupabase()
          .from("lists")
          .delete()
          .eq("id", list.id);

        if (deleteError) {
          console.error(
            `Error deleting duplicate list ${list.id}:`,
            deleteError,
          );
        } else {
          console.log(`Successfully deleted duplicate list ${list.id}`);
        }
      }
    } else {
      console.log("No duplicate default lists found");
    }
  } catch (error) {
    console.error("Error cleaning up duplicate lists:", error);
    // Don't rethrow to prevent app from crashing during startup
  }
};
