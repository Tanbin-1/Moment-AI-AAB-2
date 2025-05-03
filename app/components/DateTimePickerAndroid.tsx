import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";

interface DateTimePickerAndroidProps {
  value: Date;
  mode: "date" | "time" | "datetime";
  onChange: (event: any, date?: Date) => void;
  onClose?: () => void;
}

const DateTimePickerAndroid = ({
  value,
  mode,
  onChange,
  onClose,
}: DateTimePickerAndroidProps) => {
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [year, setYear] = useState(selectedDate.getFullYear().toString());
  const [month, setMonth] = useState(
    (selectedDate.getMonth() + 1).toString().padStart(2, "0"),
  );
  const [day, setDay] = useState(
    selectedDate.getDate().toString().padStart(2, "0"),
  );
  const [hours, setHours] = useState(
    (selectedDate.getHours() % 12 || 12).toString().padStart(2, "0"),
  );
  const [minutes, setMinutes] = useState(
    selectedDate.getMinutes().toString().padStart(2, "0"),
  );
  const [ampm, setAmPm] = useState(selectedDate.getHours() >= 12 ? "PM" : "AM");

  // Helper function to validate and format month input
  const validateMonth = (text: string) => {
    // Allow empty input for typing
    if (text === "") {
      setMonth("");
      return;
    }
    
    const monthNum = parseInt(text);
    if (!isNaN(monthNum)) {
      // Restrict month to 1-12
      if (monthNum >= 1 && monthNum <= 12) {
        setMonth(text);
      } else if (monthNum > 12) {
        // If input is greater than 12, set to 12
        setMonth("12");
      } else if (monthNum < 1 && text.length >= 1) {
        // If input is less than 1, set to 1
        setMonth("1");
      }
    }
  };
  
  // Helper function to validate and format day input
  const validateDay = (text: string) => {
    // Allow empty input for typing
    if (text === "") {
      setDay("");
      return;
    }

    const dayNum = parseInt(text);
    if (!isNaN(dayNum)) {
      // Get max days in current month
      const monthNum = parseInt(month || "1");
      const yearNum = parseInt(year || new Date().getFullYear().toString());
      const maxDays = new Date(yearNum, monthNum, 0).getDate();
      
      console.log(`Month: ${monthNum}, Year: ${yearNum}, Max days: ${maxDays}`);
      
      // Restrict day to 1-maxDays
      if (dayNum >= 1 && dayNum <= maxDays) {
        setDay(text);
      } else if (dayNum > maxDays) {
        // If input is greater than max days in month, set to max days
        setDay(maxDays.toString());
      } else if (dayNum < 1 && text.length >= 1) {
        // If input is less than 1, set to 1
        setDay("1");
      }
    }
  };
  
  // Helper function to validate and format hours input
  const validateHours = (text: string) => {
    // Allow empty input for typing
    if (text === "") {
      setHours("");
      return;
    }

    const hourNum = parseInt(text);
    if (!isNaN(hourNum)) {
      // Restrict hours to 1-12 for 12-hour format
      if (hourNum >= 1 && hourNum <= 12) {
        setHours(hourNum.toString());
      } else if (hourNum > 12) {
        // If input is greater than 12, set to 12
        setHours("12");
      } else if (hourNum < 1 && text.length >= 1) {
        // If input is less than 1, set to 1
        setHours("1");
      }
    }
  };
  
  // Helper function to validate and format minutes input
  const validateMinutes = (text: string) => {
    // Allow empty input for typing
    if (text === "") {
      setMinutes("");
      return;
    }

    // If the text is a valid number
    if (/^\d+$/.test(text)) {
      const minuteNum = parseInt(text);
      
      // During typing, allow any number, but validate when complete
      if (text.length <= 2) {
        setMinutes(text);
        
        // If we've typed a complete value that's out of range, fix it
        if (text.length === 2 && minuteNum > 59) {
          setMinutes("59");
        }
      } else {
        // If more than 2 digits, cap at 59
        setMinutes("59");
      }
    }
  };

  const updateDate = () => {
    try {
      // Parse input values, with fallbacks for empty fields
      const newYear = parseInt(year) || new Date().getFullYear();
      const newMonth = (parseInt(month) || 1) - 1; // 0-based month
      const newDay = parseInt(day) || 1;

      // Get maximum days in the selected month/year
      const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
      const validatedDay = Math.min(newDay, maxDays);

      // Convert hours from 12-hour to 24-hour format if needed
      let newHours = parseInt(hours) || 12; // Default to 12 if empty
      if (mode !== "date") {
        // If in 12-hour format, adjust based on AM/PM
        if (ampm === "PM" && newHours < 12) {
          newHours += 12;
        } else if (ampm === "AM" && newHours === 12) {
          newHours = 0;
        }
      } else {
        newHours = selectedDate.getHours();
      }

      // Properly parse and validate minutes
      let newMinutes = 0;
      if (mode !== "date") {
        // Parse minutes, default to 0 if invalid
        newMinutes = parseInt(minutes) || 0;
        // Ensure minutes are in valid range
        newMinutes = Math.min(Math.max(0, newMinutes), 59);
      } else {
        newMinutes = selectedDate.getMinutes();
      }

      // Validate all ranges again before creating date
      if (
        newYear >= 1900 && newYear <= 2100 && // Reasonable year range
        newMonth >= 0 && newMonth < 12 &&
        validatedDay > 0 && validatedDay <= maxDays &&
        newHours >= 0 && newHours < 24 &&
        newMinutes >= 0 && newMinutes < 60
      ) {
        const newDate = new Date(
          newYear,
          newMonth,
          validatedDay,
          newHours,
          newMinutes
        );
        setSelectedDate(newDate);
        onChange({ type: "set" }, newDate);
      }
    } catch (error) {
      console.error("Error updating date:", error);
    }
  };

  const handleSave = () => {
    updateDate();
    if (onClose) onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === "date"
            ? "Select Date"
            : mode === "time"
              ? "Select Time"
              : "Select Date & Time"}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {(mode === "date" || mode === "datetime") && (
          <View style={styles.dateSection}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Month</Text>
                <TextInput
                  style={styles.input}
                  value={month}
                  onChangeText={validateMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor="#8E94A7"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Day</Text>
                <TextInput
                  style={styles.input}
                  value={day}
                  onChangeText={validateDay}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="DD"
                  placeholderTextColor="#8E94A7"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="YYYY"
                  placeholderTextColor="#8E94A7"
                />
              </View>
            </View>
          </View>
        )}

        {(mode === "time" || mode === "datetime") && (
          <View style={styles.timeSection}>
            <Text style={styles.sectionTitle}>Time</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hour</Text>
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={validateHours}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="HH"
                  placeholderTextColor="#8E94A7"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Minute</Text>
                <TextInput
                  style={styles.input}
                  value={minutes}
                  onChangeText={validateMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor="#8E94A7"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>AM/PM</Text>
                <View style={styles.ampmContainer}>
                  <TouchableOpacity
                    style={[
                      styles.ampmButton,
                      ampm === "AM" && styles.ampmButtonSelected,
                    ]}
                    onPress={() => setAmPm("AM")}
                  >
                    <Text
                      style={[
                        styles.ampmText,
                        ampm === "AM" && styles.ampmTextSelected,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.ampmButton,
                      ampm === "PM" && styles.ampmButtonSelected,
                    ]}
                    onPress={() => setAmPm("PM")}
                  >
                    <Text
                      style={[
                        styles.ampmText,
                        ampm === "PM" && styles.ampmTextSelected,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121726", // Dark navy background
    borderRadius: 10,
    padding: 16,
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: "#3478F6",
    fontWeight: "bold",
  },
  dateSection: {
    marginBottom: 16,
  },
  timeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: "#8E94A7",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#1E2338",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#3478F6",
  },
  ampmContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E2338",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3478F6",
    overflow: "hidden",
    height: 50, // Match height of input boxes
  },
  ampmButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  ampmButtonSelected: {
    backgroundColor: "#3478F6",
  },
  ampmText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  ampmTextSelected: {
    fontWeight: "bold",
  },
  saveButton: {
    backgroundColor: "#3478F6",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DateTimePickerAndroid;
