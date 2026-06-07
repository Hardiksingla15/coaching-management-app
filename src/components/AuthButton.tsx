import { COLORS } from "../constants/colors";
import {
    TouchableOpacity,
    Text,
  } from "react-native";
  
  type Props = {
    title: string;
    onPress?: () => void;
    disabled?: boolean;
  };

  export default function AuthButton({
    title,
    onPress,
    disabled = false,
  }: Props) {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={{
          backgroundColor: disabled ? "#999" : COLORS.primary,
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