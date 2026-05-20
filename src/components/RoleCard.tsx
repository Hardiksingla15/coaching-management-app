import {
    TouchableOpacity,
    Text,
    View,
  } from "react-native";
  
  import { Ionicons } from "@expo/vector-icons";
  
  type Props = {
    title: string;
    icon: any;
    onPress?: () => void;
  };
  
  export default function RoleCard({
    title,
    icon,
    onPress,
  }: Props) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: "#f5f5f5",
          padding: 25,
          borderRadius: 16,
          marginBottom: 20,
        }}
      >
        <View
          style={{
            alignItems: "center",
          }}
        >
          <Ionicons
            name={icon}
            size={40}
            color="black"
          />
  
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 10,
            }}
          >
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }