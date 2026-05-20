
import { SPACING } from "../constants/spacing";
import {
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  icon: any;
  onPress?: () => void;
};

export default function DashboardCard({
  title,
  icon,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: COLORS.card,
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={24}
          color="black"
          style={{ marginRight: 12 }}
        />

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}