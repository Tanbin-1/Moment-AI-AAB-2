import React, { useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Plus, Check, X, Trash2, Edit2 } from "lucide-react-native";
import { useAppContext } from "../context/AppContext";

interface ListSelectorProps {
  selectedListId: string | null;
  onSelectList?: (listId: string) => void;
  compact?: boolean;
}

const COLORS = [
  "#3478F6", // Blue
  "#34C759", // Green
  "#FF9500", // Orange
  "#FF2D55", // Pink
  "#AF52DE", // Purple
  "#FF3B30", // Red
  "#5AC8FA", // Light Blue
  "#FFCC00", // Yellow
];

const ListSelector = memo(
  ({ selectedListId, onSelectList, compact = false }: ListSelectorProps) => {
    const { lists, selectList, addList, deleteList, updateList, isDarkMode } =
      useAppContext();
    const [isEditListModalVisible, setIsEditListModalVisible] = useState(false);
    const [editingList, setEditingList] = useState<List | null>(null);
    const [editListName, setEditListName] = useState("");
    const [editListColor, setEditListColor] = useState("");
    const [isAddListModalVisible, setIsAddListModalVisible] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleSelectList = (listId: string) => {
      if (onSelectList) {
        onSelectList(listId);
      } else {
        selectList(listId);
      }
    };

    const handleEditList = (list: List) => {
      setEditingList(list);
      setEditListName(list.name);
      setEditListColor(list.color);
      setIsEditListModalVisible(true);
    };

    const handleUpdateList = () => {
      if (editingList && editListName.trim()) {
        updateList(editingList.id, {
          name: editListName.trim(),
          color: editListColor,
        });
        setEditingList(null);
        setEditListName("");
        setEditListColor("");
        setIsEditListModalVisible(false);
      }
    };

    const handleAddList = () => {
      if (newListName.trim()) {
        addList({
          name: newListName.trim(),
          color: selectedColor,
        });
        setNewListName("");
        setSelectedColor(COLORS[0]);
        setIsAddListModalVisible(false);
      }
    };

    if (compact) {
      return (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${selectedListId === list.id ? (isDarkMode ? "bg-blue-900" : "bg-blue-100") : isDarkMode ? "bg-[#1E2338]" : "bg-gray-100"}`}
                onPress={() => handleSelectList(list.id)}
                style={{ borderLeftWidth: 3, borderLeftColor: list.color }}
              >
                <Text
                  className={`${selectedListId === list.id ? (isDarkMode ? "text-blue-300" : "text-blue-500") : isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                  numberOfLines={1}
                >
                  {list.name}
                </Text>
                {selectedListId === list.id && (
                  <Check size={16} color="#3478F6" className="ml-1" />
                )}
                <View className="flex-row">
                  <TouchableOpacity
                    className="ml-2"
                    onPress={() => handleEditList(list)}
                  >
                    <Edit2 size={14} color="#3478F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="ml-2"
                    onPress={() => deleteList(list.id)}
                  >
                    <Trash2 size={14} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className={`px-4 py-2 rounded-full flex-row items-center ${isDarkMode ? "bg-[#1E2338]" : "bg-gray-100"}`}
              onPress={() => setIsAddListModalVisible(true)}
            >
              <Plus size={16} color="#3478F6" />
              <Text
                className={`ml-1 ${isDarkMode ? "text-blue-300" : "text-blue-500"}`}
              >
                New List
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <AddListModal
            visible={isAddListModalVisible}
            onClose={() => setIsAddListModalVisible(false)}
            onAdd={handleAddList}
            name={newListName}
            setName={setNewListName}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            colors={COLORS}
            isDarkMode={isDarkMode}
          />
        </View>
      );
    }

    return (
      <View
        className={`rounded-xl shadow-sm p-4 ${isDarkMode ? "bg-[#1E2338]" : "bg-white"}`}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            My Lists
          </Text>
          <TouchableOpacity
            className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center"
            onPress={() => setIsAddListModalVisible(true)}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="max-h-40">
          {lists.map((list) => (
            <TouchableOpacity
              key={list.id}
              className={`flex-row items-center p-3 mb-2 rounded-lg ${selectedListId === list.id ? (isDarkMode ? "bg-blue-900" : "bg-blue-100") : isDarkMode ? "bg-[#1E2338]" : "bg-gray-50"}`}
              onPress={() => handleSelectList(list.id)}
            >
              <View
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: list.color }}
              />
              <Text
                className={`flex-1 ${selectedListId === list.id ? (isDarkMode ? "font-medium text-blue-300" : "font-medium text-blue-500") : isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                numberOfLines={1}
              >
                {list.name}
              </Text>
              {selectedListId === list.id && (
                <Check size={18} color="#3478F6" />
              )}
              <View className="flex-row">
                <TouchableOpacity
                  className="ml-2 p-2"
                  onPress={() => handleEditList(list)}
                >
                  <Edit2 size={16} color="#3478F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="ml-2 p-2"
                  onPress={() => deleteList(list.id)}
                >
                  <Trash2 size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <AddListModal
          visible={isAddListModalVisible}
          onClose={() => setIsAddListModalVisible(false)}
          onAdd={handleAddList}
          name={newListName}
          setName={setNewListName}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          colors={COLORS}
          isDarkMode={isDarkMode}
        />

        <EditListModal
          visible={isEditListModalVisible}
          onClose={() => setIsEditListModalVisible(false)}
          onUpdate={handleUpdateList}
          name={editListName}
          setName={setEditListName}
          selectedColor={editListColor}
          setSelectedColor={setEditListColor}
          colors={COLORS}
          isDarkMode={isDarkMode}
        />
      </View>
    );
  },
);

interface AddListModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  name: string;
  setName: (name: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  colors: string[];
  isDarkMode: boolean;
}

const AddListModal = ({
  visible,
  onClose,
  onAdd,
  name,
  setName,
  selectedColor,
  setSelectedColor,
  colors,
  isDarkMode,
}: AddListModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/30">
        <View
          className={`p-6 rounded-t-3xl ${isDarkMode ? "bg-[#121726]" : "bg-white"}`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              New List
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <TextInput
            className={`p-4 rounded-xl mb-6 ${isDarkMode ? "bg-[#1E2338] text-white" : "bg-gray-100 text-gray-800"}`}
            placeholder="List name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />

          <Text
            className={`mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Choose a color
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                className={`w-10 h-10 rounded-full m-2 items-center justify-center ${selectedColor === color ? "border-2 border-blue-500" : ""}`}
                style={{ backgroundColor: color }}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Check size={18} color="white" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-xl items-center"
            onPress={onAdd}
          >
            <Text className="text-white font-semibold">Create List</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface EditListModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  name: string;
  setName: (name: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  colors: string[];
  isDarkMode: boolean;
}

const EditListModal = ({
  visible,
  onClose,
  onUpdate,
  name,
  setName,
  selectedColor,
  setSelectedColor,
  colors,
  isDarkMode,
}: EditListModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/30">
        <View
          className={`p-6 rounded-t-3xl ${isDarkMode ? "bg-[#121726]" : "bg-white"}`}
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Edit List
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <TextInput
            className={`p-4 rounded-xl mb-6 ${isDarkMode ? "bg-[#1E2338] text-white" : "bg-gray-100 text-gray-800"}`}
            placeholder="List name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />

          <Text
            className={`mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Choose a color
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                className={`w-10 h-10 rounded-full m-2 items-center justify-center ${selectedColor === color ? "border-2 border-blue-500" : ""}`}
                style={{ backgroundColor: color }}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Check size={18} color="white" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-xl items-center"
            onPress={onUpdate}
          >
            <Text className="text-white font-semibold">Update List</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default memo(ListSelector);
