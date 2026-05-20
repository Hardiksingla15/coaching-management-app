import { COLORS } from "../constants/colors";
import {
    TouchableOpacity,
    Text,
  } from "react-native";
  
  type Props = {
    title: string;
    onPress?: () => void;
  };
  
  export default function AuthButton({
    title,
    onPress,
  }: Props) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: COLORS.primary,
          padding: 18,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  }