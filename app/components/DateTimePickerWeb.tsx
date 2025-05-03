import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";

interface DateTimePickerWebProps {
  value: Date;
  mode: "date" | "time" | "datetime";
  onChange: (event: any, date?: Date) => void;
  onClose?: () => void;
}

const DateTimePickerWeb = ({
  value,
  mode,
  onChange,
  onClose,
}: DateTimePickerWebProps) => {
  // Only render this component on web
  if (Platform.OS !== "web") {
    return null;
  }

  const [displayValue, setDisplayValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(formatValue(value));
  const [minuteValue, setMinuteValue] = useState(value.getMinutes().toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDisplayValue(value));
      setInputValue(formatValue(value));
      setMinuteValue(value.getMinutes().toString());
    }
  }, [value]);

  // Handle HTML input changes
  const handleNativeInputChange = (e: any) => {
    // This is for the native HTML input element
    try {
      const newDate = new Date(e.target.value);
      if (!isNaN(newDate.getTime())) {
        // Ensure the date is respected
        onChange({ type: "set" }, newDate);
        
        // Update local display value to reflect changes
        setDisplayValue(formatDisplayValue(newDate));
      }
    } catch (error) {
      console.error("Error handling native input change:", error);
    }
  };

  // Format value for HTML input elements
  function formatValue(date: Date): string {
    if (!date) return "";

    if (mode === "date") {
      // For the input value, we need YYYY-MM-DD format for HTML input
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    } else if (mode === "time") {
      return date.toISOString().split("T")[1].substring(0, 5); // HH:MM
    } else {
      // datetime-local format: YYYY-MM-DDThh:mm
      return date.toISOString().slice(0, 16);
    }
  }

  // Format for display (MM-DD-YYYY)
  const formatDisplayValue = (date: Date) => {
    if (!date) return "";

    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    if (mode === "date") {
      return `${month}-${day}-${year}`;
    } else if (mode === "time") {
      // Convert to 12-hour format with AM/PM
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${hours12}:${minutes} ${ampm}`;
    } else {
      // Convert to 12-hour format with AM/PM for datetime
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${month}-${day}-${year} ${hours12}:${minutes} ${ampm}`;
    }
  };

  // Parse and validate manually entered date/time
  const handleDisplayChange = (text: string) => {
    setDisplayValue(text);

    try {
      // Parse date in MM-DD-YYYY format
      if ((mode === "date" || mode === "datetime") && text.includes("-")) {
        const parts = text.split("-");
        if (parts.length === 3) {
          const monthInput = parseInt(parts[0], 10);
          const dayInput = parseInt(parts[1], 10);
          const yearInput = parseInt(parts[2], 10);
          
          // Skip processing if any part is not a valid number
          if (isNaN(monthInput) || isNaN(dayInput) || isNaN(yearInput)) {
            return;
          }
          
          // Validate month (1-12)
          const month = Math.min(Math.max(1, monthInput), 12) - 1; // 0-based
          
          // Validate year (reasonable range)
          const year = Math.min(Math.max(1900, yearInput), 2100);
          
          // Get max days in the month
          const maxDays = new Date(year, month + 1, 0).getDate();
          console.log(`Month: ${month+1}, Max days: ${maxDays}`);
          
          // Validate day (1-maxDays)
          const day = Math.min(Math.max(1, dayInput), maxDays);
          
          let hours = value.getHours();
          let minutes = value.getMinutes();
          
          // Parse time if datetime mode and time portion exists
          if (mode === "datetime" && text.includes(" ") && text.includes(":")) {
            const timePart = text.split(" ")[1];
            if (timePart) {
              const timeWithAmPm = text.split(" ").slice(1).join(" ");
              const timeMatch = timeWithAmPm.match(/(\d+):(\d+)\s*(AM|PM)?/i);
              
              if (timeMatch) {
                let hoursInput = parseInt(timeMatch[1], 10);
                const minutesInput = parseInt(timeMatch[2], 10);
                const ampm = timeMatch[3]?.toUpperCase() || (hours >= 12 ? "PM" : "AM");
                
                // Validate hours (1-12)
                hoursInput = Math.min(Math.max(1, hoursInput), 12);
                
                // Convert to 24-hour format
                if (ampm === "PM" && hoursInput < 12) {
                  hours = hoursInput + 12;
                } else if (ampm === "AM" && hoursInput === 12) {
                  hours = 0;
                } else {
                  hours = hoursInput;
                }
                
                // Validate minutes (0-59)
                minutes = Math.min(Math.max(0, minutesInput), 59);
              }
            }
          }
          
          const newDate = new Date(year, month, day, hours, minutes);
          if (!isNaN(newDate.getTime())) {
            onChange({ type: "set" }, newDate);
          }
        }
      }
      // Parse time in HH:MM AM/PM format
      else if (mode === "time" && text.includes(":")) {
        const timeMatch = text.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          let hoursInput = parseInt(timeMatch[1], 10);
          const minutesInput = parseInt(timeMatch[2], 10);
          const ampm = timeMatch[3]?.toUpperCase() || (value.getHours() >= 12 ? "PM" : "AM");
          
          // Validate hours (1-12)
          hoursInput = Math.min(Math.max(1, hoursInput), 12);
          
          // Convert to 24-hour
          let hours;
          if (ampm === "PM" && hoursInput < 12) {
            hours = hoursInput + 12;
          } else if (ampm === "AM" && hoursInput === 12) {
            hours = 0;
          } else {
            hours = hoursInput;
          }
          
          // Validate minutes (0-59)
          const minutes = Math.min(Math.max(0, minutesInput), 59);
          
          // Create new date object preserving the current date
          const newDate = new Date(value);
          newDate.setHours(hours);
          newDate.setMinutes(minutes);
          
          if (!isNaN(newDate.getTime())) {
            onChange({ type: "set" }, newDate);
          }
        }
      }
    } catch (error) {
      console.error("Error parsing date input:", error);
      // Don't update the date if there's an error
    }
  };

  const inputType =
    mode === "date" ? "date" : mode === "time" ? "time" : "datetime-local";

  // Directly manipulate the time inputs
  const handleTimeManualInput = () => {
    if (Platform.OS !== "web" || !inputRef.current) return;
    
    // Create inputs for hours and minutes
    const hoursMinutesDiv = document.createElement("div");
    hoursMinutesDiv.style.display = "flex";
    hoursMinutesDiv.style.width = "100%";
    hoursMinutesDiv.style.marginTop = "8px";
    
    // Hours input
    const hoursInput = document.createElement("input");
    hoursInput.type = "number";
    hoursInput.min = "1";
    hoursInput.max = "12";
    hoursInput.value = (value.getHours() % 12 || 12).toString();
    hoursInput.style.flex = "1";
    hoursInput.style.marginRight = "8px";
    hoursInput.style.padding = "12px";
    hoursInput.style.fontSize = "16px";
    hoursInput.style.color = "#FFFFFF";
    hoursInput.style.backgroundColor = "#1E2338";
    hoursInput.style.border = "1px solid #2A3249";
    hoursInput.style.borderRadius = "8px";
    hoursInput.placeholder = "Hour (1-12)";
    
    // Minutes input
    const minutesInput = document.createElement("input");
    minutesInput.type = "text";
    minutesInput.inputMode = "numeric";
    minutesInput.pattern = "[0-9]*";
    minutesInput.value = minuteValue;
    minutesInput.style.flex = "1";
    minutesInput.style.marginRight = "8px";
    minutesInput.style.padding = "12px";
    minutesInput.style.fontSize = "16px";
    minutesInput.style.color = "#FFFFFF";
    minutesInput.style.backgroundColor = "#1E2338";
    minutesInput.style.border = "1px solid #2A3249";
    minutesInput.style.borderRadius = "8px";
    minutesInput.placeholder = "Min (0-59)";
    
    // AM/PM Select
    const ampmSelect = document.createElement("select");
    ampmSelect.style.flex = "1";
    ampmSelect.style.padding = "12px";
    ampmSelect.style.fontSize = "16px";
    ampmSelect.style.color = "#FFFFFF";
    ampmSelect.style.backgroundColor = "#1E2338";
    ampmSelect.style.border = "1px solid #2A3249";
    ampmSelect.style.borderRadius = "8px";
    
    const amOption = document.createElement("option");
    amOption.value = "AM";
    amOption.textContent = "AM";
    
    const pmOption = document.createElement("option");
    pmOption.value = "PM";
    pmOption.textContent = "PM";
    
    if (value.getHours() >= 12) {
      pmOption.selected = true;
    } else {
      amOption.selected = true;
    }
    
    ampmSelect.appendChild(amOption);
    ampmSelect.appendChild(pmOption);
    
    // Event handlers
    const updateTime = () => {
      try {
        const hours = parseInt(hoursInput.value, 10) || 1;
        const minutes = parseInt(minutesInput.value, 10) || 0;
        const isPM = ampmSelect.value === "PM";
        
        // Update local minute state
        setMinuteValue(minutes.toString());
        
        // Validate inputs
        const validatedHours = Math.min(Math.max(1, hours), 12);
        const validatedMinutes = Math.min(Math.max(0, minutes), 59);
        
        // Convert to 24-hour format
        let hours24 = validatedHours;
        if (isPM && hours24 < 12) hours24 += 12;
        if (!isPM && hours24 === 12) hours24 = 0;
        
        // Create new date
        const newDate = new Date(value);
        newDate.setHours(hours24);
        newDate.setMinutes(validatedMinutes);
        
        if (!isNaN(newDate.getTime())) {
          onChange({ type: "set" }, newDate);
          
          // Update display value to reflect the new time
          const updatedDisplayValue = formatDisplayValue(newDate);
          setDisplayValue(updatedDisplayValue);
        }
      } catch (error) {
        console.error("Error updating time:", error);
      }
    };
    
    // Special handler for minutes to ensure immediate updates
    const handleMinuteInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const inputText = target.value;
      
      // Only allow numbers
      if (!/^\d*$/.test(inputText)) {
        target.value = minuteValue;
        return;
      }
      
      // Empty input is allowed during typing
      if (inputText === "") {
        setMinuteValue("");
        return;
      }
      
      const minutes = parseInt(inputText, 10);
      
      // If valid number
      if (!isNaN(minutes)) {
        // Allow any input during typing, but validate on update
        setMinuteValue(inputText);
        
        // Validate the range for immediate feedback if over 59
        if (minutes > 59) {
          setMinuteValue("59");
          target.value = "59";
        }
      }
    };
    
    // Final validation and update on blur
    const handleMinuteBlur = () => {
      let finalValue = minuteValue;
      
      // If empty, default to 0
      if (finalValue === "") {
        finalValue = "0";
      }
      
      // If greater than 59, cap at 59
      const numValue = parseInt(finalValue, 10);
      if (numValue > 59) {
        finalValue = "59";
      }
      
      setMinuteValue(finalValue);
      minutesInput.value = finalValue;
      updateTime();
    };
    
    // Use both change and input events to capture all changes
    hoursInput.addEventListener("change", updateTime);
    hoursInput.addEventListener("input", updateTime);
    
    minutesInput.addEventListener("change", updateTime);
    minutesInput.addEventListener("input", handleMinuteInput);
    minutesInput.addEventListener("blur", handleMinuteBlur);
    
    ampmSelect.addEventListener("change", updateTime);
    
    hoursMinutesDiv.appendChild(hoursInput);
    hoursMinutesDiv.appendChild(minutesInput);
    hoursMinutesDiv.appendChild(ampmSelect);
    
    // Replace the regular input
    const inputContainer = inputRef.current.parentElement;
    if (inputContainer) {
      inputContainer.style.display = "none";
      inputContainer.parentElement?.insertBefore(hoursMinutesDiv, inputContainer.nextSibling);
    }
  };
  
  useEffect(() => {
    if (mode === "time" || mode === "datetime") {
      // Setup the manual time inputs after component mounts
      setTimeout(handleTimeManualInput, 100);
    }
    
    // Cleanup on component unmount
    return () => {
      // Remove any custom elements we've added when component unmounts
      if (Platform.OS === "web" && inputRef.current) {
        const inputContainer = inputRef.current.parentElement;
        if (inputContainer && inputContainer.parentElement) {
          const customInputs = inputContainer.parentElement.querySelectorAll('div');
          customInputs.forEach(element => {
            if (element !== inputContainer && element.style.display === "flex") {
              element.remove();
            }
          });
        }
      }
    };
  }, []);

  // Render the native HTML input for web
  const renderNativeInput = () => {
    if (Platform.OS !== "web") return null;
    
    return (
      <div style={webStyles.inputContainer}>
        <input
          ref={inputRef}
          type={inputType}
          value={inputValue}
          onChange={handleNativeInputChange}
          style={webStyles.input}
        />
      </div>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === "date" ? "Select Date" : mode === "time" ? "Select Time" : "Select Date & Time"}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.dateDisplay}
        onPress={() => setIsEditing(true)}
        activeOpacity={0.7}
      >
        {isEditing ? (
          <TextInput
            value={displayValue}
            onChangeText={handleDisplayChange}
            style={styles.dateInput}
            placeholder={
              mode === "date" 
                ? "MM-DD-YYYY" 
                : mode === "time" 
                  ? "HH:MM AM/PM" 
                  : "MM-DD-YYYY HH:MM AM/PM"
            }
            placeholderTextColor="#8E94A7"
            autoFocus
            onBlur={() => setIsEditing(false)}
            keyboardType="numbers-and-punctuation"
          />
        ) : (
          <Text style={styles.dateText}>{formatDisplayValue(value)}</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.helperText}>
        {mode === "date" 
          ? "Format: MM-DD-YYYY (Month: 1-12, Day: 1-31 based on month)" 
          : mode === "time" 
            ? "Format: HH:MM AM/PM (Hour: 1-12, Minute: 0-59)" 
            : "Format: MM-DD-YYYY HH:MM AM/PM"}
      </Text>

      {/* Use renderNativeInput to insert HTML input element */}
      {renderNativeInput()}
    </View>
  );
};

// Styles for web elements (rendered as HTML)
const webStyles = {
  inputContainer: {
    width: '100%',
    marginTop: 8,
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    color: '#FFFFFF',
    backgroundColor: '#1E2338',
    border: '1px solid #2A3249',
    borderRadius: '8px',
  },
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121726", // Dark navy background from the image
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
  dateDisplay: {
    backgroundColor: "#1E2338",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3478F6",
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  dateInput: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  helperText: {
    color: "#8E94A7",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2A3249", // Darker border for contrast
    backgroundColor: "#1E2338", // Slightly lighter than background
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: "100%",
    color: "#FFFFFF", // White text for contrast
  },
});

export default DateTimePickerWeb;
